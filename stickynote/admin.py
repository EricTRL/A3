from django.contrib import admin
from .models import Stickynote, Colour, Group, SortingPreference
from friends.models import Collaborator, Friend, FriendRequest

#The model registered in admin.site.register(..) can be either a single
#model or an iteratble list

myModels = [Stickynote,Colour, Collaborator,Friend, FriendRequest, Group, SortingPreference]
admin.site.register(myModels)
