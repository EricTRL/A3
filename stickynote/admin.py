from django.contrib import admin
from .models import Stickynote, Colour, Collaborator, Friend, Group

#The model registered in admin.site.register(..) can be either a single
#model or an iteratble list

myModels = [Stickynote,Colour, Collaborator,Friend, Group]
admin.site.register(myModels)
