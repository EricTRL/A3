
from django.contrib.auth.models import User #the user DB table
from .models import Stickynote, Colour #Stickynote and Colour DB table
from django.utils import timezone #timezone-data

from django.shortcuts import render

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
    return render(request, 'stickynote/index.html', {})

'''
#Retrieves all the stickies of the currently logged in User
def user_stickies(request):
    iUser = request.user
    if iUser.is_authenticated:
        print("Authenticated User: " + iUser.first_name)
        #retrieve the Sticky Notes of the currently logged in User
        tStickies = Stickynote.objects.filter(author=request.user).order_by('title')
    else:
        print('Non-logged in User!')
        tStickies = []
    return render(request, 'stickynote/index.html', {'stickies': tStickies})


#returns true if a user with the given username exists
#returns false otherwise
def validate_username(request):
    username = request.GET.get('username', None)
    data = {
        'is_taken': User.objects.filter(username__iexact=username).exists()
    }
    return JsonResponse(data)
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

#Get the RGB-values of a colour with a given name
def get_colour_rgb(request):
    colour = request.GET.get('colour',None)
    if colour == None: return JsonResponse({'status':'false','message':"ERROR: Cannot get RGB when colour is not specified"}, status=401)
    for rgb in Colour.objects.filter(id=colour):
        name = rgb.name
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;

    data = {
        'name': name,
        'r': r,
        'g': g,
        'b': b,
    }
    #print("RGB: " + str(r) + " " + str(g) + " " + str(b));
    return JsonResponse(data)

#get a random sticky colour from those in the DB
def get_random_colour(request):
    colours = [];
    i=0;
    for colour in Colour.objects.all():
        colours.append([colour.id, colour.name.lower(), colour.r, colour.g, colour.b]);
        i+=1;
    print('there are ' + str(i) + 'colours in the DB');
    randcolour = randint(0, i-1);
    data = {
        'colour': colours[randcolour][0],
        'name': colours[randcolour][1],
        'r': colours[randcolour][2],
        'g': colours[randcolour][3],
        'b': colours[randcolour][4],
    }
    print(data)
    return JsonResponse(data)

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

#Delete a single sticky from the DB (with a given id)
def delete_sticky_by_id(request, *args, **kwargs):
    if request.user.is_authenticated:
        iID = request.POST.get('id', -1)
        #the given ID should actually exist and MUST be of the currently logged in user (no wiping other's stickies!)
        if Stickynote.objects.filter(id=iID).exists() and Stickynote.objects.get(id=iID).author_id == request.user.id:
            print('got em')
            Stickynote.objects.get(id=iID).delete();
            return HttpResponseRedirect('/'); #SUCCESSFUL
    return HttpResponseRedirect('') #FAILED


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

#returns true if the client is authenticated (I.e. logged in). returns false otherwise
def user_is_authenticated(request):
    if request.user.is_authenticated:
        return JsonResponse({'authenticated': True})
    return JsonResponse({'authenticated': False})


######################################################################
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
