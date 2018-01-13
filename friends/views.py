
from django.contrib.auth.models import User #the user DB table
from stickynote.models import Stickynote, Colour, Group #DB tables
from friends.models import Friend, Collaborator, FriendRequest
from django.utils import timezone #timezone-data

from django.db.models import Q #Allow OR-lookups

from django.shortcuts import render

from django.http import JsonResponse #for AJAX requessts
from django.http import HttpResponseRedirect #redirection for POST-requests

import json #for decoding JSON strings



#Initial page load
def friends_page(request):
    stickies = [];
    groups = [];
    colours = [];

    if request.user.is_authenticated:
        stickies = Stickynote.objects.filter(group_id__author_id=request.user.id).order_by('title');
        print(stickies)
        groups = Group.objects.filter(author_id=request.user.id).order_by('-cannotBeDeleted', 'title');
        print(groups)
        colours = Colour.objects.all().order_by('name');
        print(colours)
    return render(request, 'friends/friends.html', {'stickies': stickies, 'groups': groups, 'colours': colours})


#Gets all users that have any of their data match with a given string
def get_users_by_names(request):
    sSearchData = request.GET.get('sSearchData', None)
    tUsers = [];
    if sSearchData:
        #Get the requesting user (if any)
        iRequestUser = request.user.id if request.user.is_authenticated else -1;

        print(sSearchData)
        for user in User.objects.filter(Q(username__contains=sSearchData) | Q(first_name__contains=sSearchData) | Q(last_name__contains=sSearchData)| Q(email__contains=sSearchData)).order_by('username'):
            #Exclude the requesting user from the search
            if iRequestUser != user.id:
                #Get already pending friend request:
                sStatus = FriendRequest.objects.filter(receiver=user.id, sender=request.user.id).order_by('-created_date')[0].status if FriendRequest.objects.filter(receiver=user.id, sender=request.user.id).exists() else "NONE";
                tUsers.append([user.id, user.username, sStatus, user.first_name, user.last_name, user.email, user.last_login, user.date_joined, user.is_superuser, user.is_staff, user.is_active]);
        print(tUsers)
    return JsonResponse({"tUsers": tUsers})


################################################################################
##Friend Requests

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

        #Users must exist and cannot send to yourself
        if iUserSender and sStatus and (sStatus in tValidStatuses) and User.objects.filter(id=iUserSender).exists():
            #cannot only make a response to an existing request
            if FriendRequest.objects.filter(status="PENDING", sender=iUserSender, receiver=request.user.id).exists():
                pRequest = FriendRequest.objects.get(status="PENDING", sender=iUserSender, receiver=request.user.id);
                pRequest.status = sStatus;
                pRequest.save();

                #Only become friends if we actually accept and we cannot be friends yet
                if sStatus == "ACCEPTED" and not Friend.objects.filter(Q(user1_id=iUserSender, user2_id=request.user.id) | Q(user1_id=request.user.id, user2_id=iUserSender)).exists():
                    Friend.objects.create(user1_id=iUserSender, user2_id=request.user.id, friended_date=timezone.now());

                return HttpResponseRedirect('/') #redirect to nothing (but we still need to return something in order to fire the success() function)
    return HttpResponseRedirect('') #redirect to nothing (ajax fail function fires too)












#comment here to prevent Atom from removing these lines
