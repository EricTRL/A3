
from django.contrib.auth.models import User #the user DB table
from stickynote.models import Stickynote, Colour, Group #DB tables
from friends.models import Friend, Collaborator, FriendRequest
from django.utils import timezone #timezone-data

from django.db.models import Q #Allow OR-lookups
from random import randint #random number generator

from django.shortcuts import render

from django.http import JsonResponse #for AJAX requessts
from django.http import HttpResponseRedirect #redirection for POST-requests
from django.contrib.auth import authenticate, login, logout #authenticate, login, and logout users
from django.contrib.auth.decorators import login_required # to require users to log in

import json #for decoding JSON strings

from django.db.models import Count #Count

#Initial page load
@login_required
def friends_page(request):
    user= request.user.id
    outgoing = FriendRequest.objects.filter(sender=user, status='PENDING')
    incoming = FriendRequest.objects.filter(receiver=user, status='PENDING')
    friends1 = Friend.objects.filter(user1=user)
    friends2 = Friend.objects.filter(user2=user)
    print(outgoing)
    print(incoming)
    return render(request, 'friends/friends.html', {'outgoings':outgoing, 'incomings': incoming, 'friends1s': friends1, 'friends2s': friends2})

#Does this even do anything?
"""
def addfriends(request):
	if request.method == "POST":
		form = FriendRequestForm(request.POST)
		if form.is_valid():
			user = form.save(commit=False)
			user.first_name = form.cleaned_data['username']
			user.last_name = form.cleaned_data['first_name']
			return redirect('friends/friends.html')
	else:
		form = UserCreationForm()
	return render(request, 'friends/friends.html', {'form': form, 'formNames': formNames})
"""

@login_required
def view_friend(request, friend_id):
    stickies = [];
    groups = [];
    colours = [];

    iGroupHeaderColourModifier = 0.75;

    stickies = Stickynote.objects.filter(Q(group_id__author_id=friend_id), Q(shared=True) | Q(group_id__shared=True)).order_by('title');
    print(stickies.exists())
    print(request.user.id)
    print(friend_id)
    if stickies.exists() or friend_id==request.user.id:
        groups = Group.objects.filter(author_id=friend_id);
        #Exclude empty groups
        for group in groups:
            if not stickies.filter(group_id=group.id).exists():
                groups = groups.exclude(id=group.id);
        groups.order_by('-cannotBeDeleted', 'title');

        #Get&Set the colour that most stickies in a group have.
        for group in groups:
            groupStickies = stickies.filter(group_id=group.id);
            majorityColour = groupStickies.values("colour_id").annotate(Count("id")).order_by('-id__count');
            majorityColour = majorityColour[0] if majorityColour.count() > 0 else {'colour_id': GetRandomColour().id,'id__count': 0};

            #majorityColour = Colour.objects.get(id=majorityColour.colour_id);
            majorityColour['r'] = round(Colour.objects.get(id=majorityColour['colour_id']).r*iGroupHeaderColourModifier);
            majorityColour['g'] = round(Colour.objects.get(id=majorityColour['colour_id']).b*iGroupHeaderColourModifier);
            majorityColour['b'] = round(Colour.objects.get(id=majorityColour['colour_id']).g*iGroupHeaderColourModifier);
            majorityColour['a'] = Colour.objects.get(id=majorityColour['colour_id']).a;
            majorityColour['colour'] = Colour.objects.get(id=majorityColour['colour_id']);
            group.majorityColour = majorityColour;
        print(groups)
        colours = Colour.objects.all().order_by('name');
        print(colours)
        return render(request, 'stickynote/index.html', {'stickies': stickies, 'groups': groups, 'colours': colours, 'author_id': friend_id})
    else:
        friend = User.objects.get(id=friend_id)
        return render(request, 'friends/noneshared.html', {'friend': friend})


@login_required
def noneshared(request):
    return render(request, 'friends/noneshared.html')

#Gets all users that have any of their data match with a given string
def get_users_by_names(request):
    sSearchData = request.GET.get('sSearchData', None)
    tUsers = [];
    if sSearchData:
        #Get the requesting user (if any)
        iRequestUser = request.user.id if request.user.is_authenticated else -1;
        sSearchData = sSearchData + " ";
        print("Total search term: " + sSearchData)

        validUsers = User.objects.none();

        iSearchTermStart = 0;
        iSearchTermEnd = sSearchData.find(' ', iSearchTermStart);
        sSearchTerm = sSearchData[iSearchTermStart:iSearchTermEnd];
        #Loop through every search term. I.e. every word separated by a whitespace. Whitespaces are treated as an OR
        while iSearchTermEnd != -1:
            print("Now searching for (" + sSearchTerm + ")");

            for user in User.objects.filter(Q(username__contains=sSearchTerm) | Q(first_name__contains=sSearchTerm) | Q(last_name__contains=sSearchTerm)| Q(email__contains=sSearchTerm)).order_by('username'):
                #Exclude the requesting user from the search
                if iRequestUser != user.id:
                    #Get already pending friend request
                    sStatus = FriendRequest.objects.filter(receiver=user.id, sender=request.user.id).order_by('-created_date')[0].status if FriendRequest.objects.filter(receiver=user.id, sender=request.user.id).exists() else "NONE";
                    #check if the users are friends. If not, then it doesn't even matter that the last request was ACCEPTED
                    sStatus = "NONE" if (sStatus=="ACCEPTED" and not UsersAreFriends(user.id, iRequestUser)) else sStatus;
                    validUsers = validUsers|User.objects.filter(id=user.id)
            iSearchTermStart = iSearchTermEnd + 1;
            iSearchTermEnd = sSearchData.find(' ', iSearchTermStart);
            sSearchTerm = sSearchData[iSearchTermStart:iSearchTermEnd];
            while sSearchTerm == "" and iSearchTermEnd != -1:
                iSearchTermStart = iSearchTermEnd + 1;
                iSearchTermEnd = sSearchData.find(' ', iSearchTermStart);
                sSearchTerm = sSearchData[iSearchTermStart:iSearchTermEnd];
        validUsers.distinct();

        #Store it to an array to be able to send it back
        for user in validUsers:
            tUsers.append([user.id, user.username, sStatus, user.first_name, user.last_name, user.email, user.last_login, user.date_joined, user.is_superuser, user.is_staff, user.is_active]);
        print(tUsers)
    return JsonResponse({"tUsers": tUsers})


################################################################################
##Friend Requests
#TODO: geen requests mogen sturen als er al n request de andere kant op staat -> auto-accept request van andere kant
#Sends a friend request from user1 to user2 (if such one doesn't yet exist)
def send_friend_request(request, *args, **kwargs):
    if request.user.is_authenticated:
        iUserReceive = request.POST.get('receiver', -1)

        #Users must exist and cannot send to yourself
        if iUserReceive and iUserReceive != request.user.id and User.objects.filter(id=iUserReceive).exists():
            #cannot send another request if one is still PENDING
            if not FriendRequest.objects.filter(Q(status="PENDING"), (Q(sender=request.user.id) | Q(receiver=request.user.id))).exists():
                FriendRequest.objects.create(sender_id=request.user.id, receiver_id=iUserReceive, status='PENDING', created_date=timezone.now());
                return HttpResponseRedirect('/') #redirect to nothing (but we still need to return something in order to fire the success() function)
    return HttpResponseRedirect('') #redirect to nothing (ajax fail function fires too)


tValidStatuses = ["PENDING","ACCEPTED","DENIED"];

#Responds to a friend request (accept, deny, TODO: block?)
def respond_friend_request(request, *args, **kwargs):
    if request.user.is_authenticated:
        iUserSender = request.POST.get('sender', -1);
        sStatus = request.POST.get('response', None)
        print(iUserSender);
        print(sStatus);

        #Users must exist and cannot send to yourself
        if iUserSender and sStatus and (sStatus in tValidStatuses) and User.objects.filter(id=iUserSender).exists():
            #cannot only make a response to an existing request
            if FriendRequest.objects.filter(status="PENDING", sender=iUserSender, receiver=request.user.id).exists():
                pRequest = FriendRequest.objects.get(status="PENDING", sender=iUserSender, receiver=request.user.id);
                pRequest.status = sStatus;
                pRequest.save();

                #Only become friends if we actually accept and we aren't friends yet
                if sStatus == "ACCEPTED" and not UsersAreFriends(iUserSender,request.user.id):
                    Friend.objects.create(user1_id=iUserSender, user2_id=request.user.id, friended_date=timezone.now());

                return HttpResponseRedirect('/') #redirect to nothing (but we still need to return something in order to fire the success() function)
    return HttpResponseRedirect('') #redirect to nothing (ajax fail function fires too)

#Returns true if two given users are friends. returns false otherwise
def UsersAreFriends(user1, user2):
    return Friend.objects.filter(Q(user1_id=user1, user2_id=user2) | Q(user1_id=user2, user2_id=user1)).exists()

#get a random sticky colour from those in the DB
def GetRandomColour():
    iRandomIndex = randint(0, Colour.objects.count() - 1);
    pRandomColour = Colour.objects.all()[iRandomIndex];
    return pRandomColour;









#comment here to prevent Atom from removing these lines
