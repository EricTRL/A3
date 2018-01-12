
from django.contrib.auth.models import User #the user DB table
from .models import Stickynote, Colour, Friend, Collaborator, Group #DB tables
from django.utils import timezone #timezone-data

from django.db.models import Count    #Count
from django.shortcuts import render #rendering

from random import randint #random number generator
from django.http import JsonResponse #for AJAX requessts
from django.http import HttpResponseRedirect #redirection for POST-requests
from django.contrib.auth import authenticate, login, logout #authenticate, login, and logout users

import json #for decoding JSON strings

#REST API:
from django.shortcuts import get_object_or_404 #Nice responses
from rest_framework.views import APIView #Lets normal view return API data
from rest_framework.response import Response #Handles JSON,... responses
from rest_framework import status
from .serializers import ColourSerializer, StickynoteSerializer, UserSerializer
from rest_framework import permissions #User permissions (I.e. extra admin priviliges)

#Initial page load
def page_load(request):
    stickies = [];
    groups = [];
    colours = [];

    iGroupHeaderColourModifier = 0.75;

    if request.user.is_authenticated:
        stickies = Stickynote.objects.filter(group_id__author_id=request.user.id).order_by('title');
        print(stickies)
        groups = Group.objects.filter(author_id=request.user.id).order_by('-cannotBeDeleted', 'title');


        for group in groups:
            groupStickies = Stickynote.objects.filter(group_id=group.id);
            print(groupStickies)
            print("----")
            majorityColour = groupStickies.values("colour_id").annotate(Count("id")).order_by('-id__count');
            print(majorityColour)
            majorityColour = majorityColour[0] if majorityColour.count() > 0 else {'colour_id': GetRandomColour().id,'id__count': 0};
            print(majorityColour)
            #majorityColour = Colour.objects.get(id=majorityColour.colour_id);
            majorityColour['r'] = round(Colour.objects.get(id=majorityColour['colour_id']).r*iGroupHeaderColourModifier);
            majorityColour['g'] = round(Colour.objects.get(id=majorityColour['colour_id']).b*iGroupHeaderColourModifier);
            majorityColour['b'] = round(Colour.objects.get(id=majorityColour['colour_id']).g*iGroupHeaderColourModifier);
            majorityColour['a'] = Colour.objects.get(id=majorityColour['colour_id']).a;
            majorityColour['colour'] = Colour.objects.get(id=majorityColour['colour_id']);

            print(majorityColour['colour'].filename)
            print(majorityColour);
            group.majorityColour = majorityColour;
        print(groups)
        colours = Colour.objects.all().order_by('name');
        print(colours)
    return render(request, 'stickynote/index.html', {'stickies': stickies, 'groups': groups, 'colours': colours})

#Gets the data of a stickynote with the given ID.
#Returns an error if no such stickynote exists
def get_sticky_by_id(request):
    if request.user.is_authenticated:
        iStickyID = request.GET.get('iStickyID',None)
        if iStickyID == None or not Stickynote.objects.filter(id=iStickyID).exists():
            return JsonResponse({'status':'false','message':"ERROR: Invalid StickynoteID passed"}, status=404)
        pSticky = Stickynote.objects.get(id=iStickyID);

        data = {
            'title':            pSticky.title,
            'contents':         pSticky.contents,
            'created_date':     pSticky.created_date,
            'last_edit_date':   pSticky.last_edit_date,
            'shared':           pSticky.shared,
            'colour_id':        pSticky.colour_id,
            'group_id':         pSticky.group_id,
        }
        return JsonResponse(data)
    return JsonResponse({'status':'false','message':"ERROR: Not Logged in, so nothing to retrieve"}, status=401)


#Gets the data of a Colour with the given ID.
#Returns an error if no such colour exists
def get_colour_by_id(request):
    iColourID = request.GET.get('iColourID',None)
    if iColourID == None or not Colour.objects.filter(id=iColourID).exists():
        return JsonResponse({'status':'false','message':"ERROR: Invalid ColourID passed"}, status=404)

    pColour = Colour.objects.get(id=iColourID);

    data = {
        'name':     pColour.name,
        'r':        pColour.r,
        'g':        pColour.g,
        'b':        pColour.b,
        'a':        pColour.a,
        'filename': pColour.filename,
    }
    return JsonResponse(data)

#
#
def set_or_create_sticky_by_id(request, *args, **kwargs):
    #Must be logged in (otherwise there's nowhere to save to)
    if request.user.is_authenticated:
        sTitle = request.POST.get('title', '');
        sContents = request.POST.get('contents', '');
        iColour = request.POST.get('colour', -1);
        iColour = Colour.objects.get(id=iColour).id if Colour.objects.filter(id=iColour).exists() else Colour.objects.order_by('id')[0].id

        iGroup = request.POST.get('group', -1);
        iGroup = Group.objects.get(id=iGroup).id if Group.objects.filter(id=iGroup).exists() else Group.objects.filter(cannotBeDeleted=True,author_id=request.user.id).order_by('id')[0].id
        bShared = request.POST.get('shared', False) == 'true';

        iID = request.POST.get('id', -1)
        if Stickynote.objects.filter(id=iID).exists():
            #Already Exists: so we update it
            pSticky = Stickynote.objects.get(id=iID)

            #Sanity check. No wiping other user's stickies (this should never happen)
            if Stickynote.objects.filter(group_id__author_id=request.user.id).count() <= 0: return HttpResponseRedirect('') #FAILED

            pSticky.title = sTitle;
            pSticky.contents = sContents;
            pSticky.colour = Colour.objects.get(id=iColour);
            pSticky.group = Group.objects.get(id=iGroup);
            pSticky.shared = bShared;
            pSticky.last_edit_date = timezone.now()

            pSticky.save()
        else:
            #Does not yet exist: so we create a new one
            Stickynote.objects.create(title=sTitle, contents=sContents, created_date=timezone.now(), shared=bShared, colour_id=iColour, group_id=iGroup);
        return HttpResponseRedirect('/'); #SUCCESSFUL
    return HttpResponseRedirect('') #FAILED


#Delete a single sticky from the DB (with a given id)
def delete_sticky_by_id(request, *args, **kwargs):
    if request.user.is_authenticated:
        iID = request.POST.get('id', -1)
        #the given ID should actually exist and MUST be of the currently logged in user (no wiping other's stickies!)
        if Stickynote.objects.filter(id=iID,group_id__author_id=request.user.id).exists():
            Stickynote.objects.get(id=iID,group_id__author_id=request.user.id).delete();
            return HttpResponseRedirect('/'); #SUCCESSFUL
    return HttpResponseRedirect('') #FAILED


#get a random sticky colour from those in the DB and send it back via AJAX
def get_random_colour(request):
    pRandomColour = GetRandomColour();

    data = {
        'id':       pRandomColour.id,
        'name':     pRandomColour.name,
        'r':        pRandomColour.r,
        'g':        pRandomColour.g,
        'b':        pRandomColour.b,
        'a':        pRandomColour.a,
        'filename': pRandomColour.filename,
    }
    print(data)
    return JsonResponse(data)

#get a random sticky colour from those in the DB
def GetRandomColour():
    iRandomIndex = randint(0, Colour.objects.count() - 1);
    pRandomColour = Colour.objects.all()[iRandomIndex];
    return pRandomColour;

'''
#Get all stickynote colours (and their RGB-values from the DB)
def retrieve_sticky_colours(request):
    #create an empty array
    colourlist = [];
    #populate it with the colournames
    for colour in Colour.objects.all().order_by('name'):
        colourlist.append([colour.id, colour.name.lower(), colour.r, colour.g, colour.b, colour.a/255]);
    print(colourlist)
    return JsonResponse({"colourlist": colourlist})
'''

#Check if the entered password and username are correct. If yes, login
def user_login(request, *args, **kwargs):
    username = request.POST.get('username', None)
    password = request.POST.get('password', None)

    if username and password and User.objects.filter(username__iexact=username).exists():
        user = User.objects.get(username=username)

        user = authenticate(username=username, password=password)
        login(request, user)
        print(str(username) + " just logged in!");
        return HttpResponseRedirect('/') #redirect to nothing (but we still need to return something in order to fire the success() function)
    else:
        return HttpResponseRedirect('') #redirect to nothing (ajax fail function fires too)

#Log the current user out
def user_logout(request):
    print('someone just logged out')
    logout(request);
    return HttpResponseRedirect('/');

'''
#Retrieve the stickynotes of the currently logged in user
def retrieve_current_user_data(request):
    if request.user.is_authenticated:
        user = request.user;
        print(user.username + " requested his/her stickies!")
        table = [];
        for sticky in Stickynote.objects.filter(author_id=user.id):
            #if, for w/e reason an invalid colour was in the DB, default to yellow
            #colour = not Colour.objects.filter(id=sticky.colour_id).exists() and "yellow" or Colour.objects.get(id=sticky.colour_id);
            table.append({'id': sticky.id, 'colour': sticky.colour_id, 'title': sticky.title, 'contents': sticky.contents})

        data = {
            'name': user.first_name,
            'stickies': table,
        }
        return JsonResponse(data)
    return JsonResponse({'status':'false','message':"ERROR: User was not logged in. Cannot retrieve stickynotes!"}, status=401)
'''

'''
#Add stickies to the DB
def create_stickies(request, *args, **kwargs):
    if request.user.is_authenticated:
        #retrieve the array (this actually requires a .getlist instead of a .get. Also, note that the "[]" are important!)
        tStickies = request.POST.getlist('stickydata[]', None)
        print(tStickies)
        if tStickies:
            for s in tStickies:
                s=json.loads(s);
                print(s);
                if s['id'] <= 0 or not Stickynote.objects.filter(id=s['id']).exists():
                    #Only create a new entry in the DB if we don't have one already
                    Stickynote.objects.create(title=s['title'], contents=s['contents'], created_date=timezone.now(), shared=False, author_id=request.user.id, colour_id=s['colour'])
                    return HttpResponseRedirect('/') #SUCCESSFUL
                elif Stickynote.objects.filter(id=s['id']).exists() and Stickynote.objects.get(id=s['id']).author_id == request.user.id:
                    #Only update if the sticky with the given ID belongs to the currently logged in user
                    sticky = Stickynote.objects.get(id=s['id'])
                    sticky.title = s['title']
                    sticky.contents = s['contents']
                    #Update the sticky colour if it exists, otherwise default to colour with id=1
                    sticky.colour = Colour.objects.get(id=s['colour']) if Colour.objects.filter(id=s['colour']).exists() else Colour.objects.get(id=1)
                    #add a "last edited"-date (not being used, but we can possibly use it in A3)
                    sticky.last_edit_date = timezone.now()
                    sticky.save()
                    return HttpResponseRedirect('/') #SUCCESSFUL
    return HttpResponseRedirect('') #FAILED
'''

#returns true if the client is authenticated (I.e. logged in). returns false otherwise
def user_is_authenticated(request):
    if request.user.is_authenticated:
        return JsonResponse({'authenticated': True})
    return JsonResponse({'authenticated': False})

################################################################################
#Groups:

#
#
def set_or_create_group_by_id(request, *args, **kwargs):
    #Must be logged in (otherwise there's nowhere to save to)
    if request.user.is_authenticated:
        sTitle = request.POST.get('title', '');
        bShared = request.POST.get('shared', False) == 'true';

        iID = request.POST.get('id', -1)
        if Group.objects.filter(id=iID).exists():
            #Already Exists: so we update it
            pGroup = Group.objects.get(id=iID)

            #Sanity check. No wiping other user's groups (this should never happen)
            if Group.objects.filter(author_id=request.user.id).count() <= 0: return HttpResponseRedirect('') #FAILED

            pGroup.title = sTitle;
            pGroup.shared = bShared;
            pGroup.last_edit_date = timezone.now();

            pGroup.save()
        else:
            #Does not yet exist: so we create a new one
            Group.objects.create(title=sTitle, created_date=timezone.now(), shared=bShared, author_id=request.user.id, cannotBeDeleted=False);
        return HttpResponseRedirect('/'); #SUCCESSFUL
    return HttpResponseRedirect('') #FAILED


#Delete a single group from the DB (with a given id).
#WARNING: Also deletes ALL stickies associated with this Group!
def delete_group_by_id(request, *args, **kwargs):
    if request.user.is_authenticated:
        iID = request.POST.get('id', -1)
        #the given ID should actually exist and MUST be of the currently logged in user (no wiping other's groups/stickies!)
        if Group.objects.filter(id=iID,author_id=request.user.id).exists():
            pGroup = Group.objects.get(id=iID,author_id=request.user.id);
            #Non-deletable groups cannot be deleted (outside of the admin-panel)
            if not pGroup.cannotBeDeleted:
                #Delete all stickies in this group first
                tStickies = Stickynote.objects.filter(group_id=iID);

                for sticky in tStickies:
                    sticky.delete();

                #Actually Delete the Group
                pGroup.delete();

                return HttpResponseRedirect('/'); #SUCCESSFUL
    return HttpResponseRedirect('') #FAILED
################################################################################
#REST API

#host/stickies/
class StickynoteList(APIView):
    '''Lists all Stickynotes'''
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get(self, request): #GET requessts
        stickies = Stickynote.objects.all()
        serializer = StickynoteSerializer(stickies, many=True)
        return Response(serializer.data)

#host/stickies/id
class StickynoteDetails(APIView):
    '''Data of a specific Stickynote'''
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get_object(self, id):
        try:
            return Stickynote.objects.get(id=id)
        except Stickynote.DoesNotExist:
            raise Http404

    def get(self, request, id, format=None):
        stickynote = self.get_object(id)
        serializer = StickynoteSerializer(stickynote)
        return Response(serializer.data)

#host/stickies/user/author_id
class StickynoteAuthorList(APIView):
    '''Lists all stickynotes of a specific User'''
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get(self, request, author_id, format=None): #GET requessts
        stickies = Stickynote.objects.filter(author_id=author_id)
        serializer = StickynoteSerializer(stickies, many=True)
        return Response(serializer.data)

#host/colours/
class ColourList(APIView):
    '''Lists all Colours'''
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get(self, request, format=None): #GET requessts
        colours = Colour.objects.all()
        serializer = ColourSerializer(colours, many=True)
        return Response(serializer.data)

#host/colours/id/
class ColourDetails(APIView):
    '''Data of a specific Colour'''
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get_object(self, id):
        try:
            return Colour.objects.get(id=id)
        except Colour.DoesNotExist:
            raise Http404

    def get(self, request, id, format=None):
        colour = self.get_object(id)
        serializer = ColourSerializer(colour)
        return Response(serializer.data)

#host/colours/
class UserList(APIView):
    '''Lists all Users'''
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get(self, request, format=None): #GET requessts
        colours = User.objects.all()
        serializer = UserSerializer(colours, many=True)
        return Response(serializer.data)

#host/user/id/
class UserDetails(APIView):
    '''Data of a specific User'''
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    def get_object(self, id):
        try:
            return User.objects.get(id=id)
        except User.DoesNotExist:
            raise Http404

    def get(self, request, id, format=None):
        user = self.get_object(id)
        serializer = UserSerializer(user)
        return Response(serializer.data)




#there's a comment here as atom keeps removing empty lines at the end of a file
