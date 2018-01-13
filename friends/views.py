
from django.contrib.auth.models import User #the user DB table
from stickynote.models import Stickynote, Colour, Group #DB tables
from friends.models import Friend, Collaborator, FriendRequest
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
