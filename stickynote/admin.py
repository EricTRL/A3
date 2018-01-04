from django.contrib import admin
from .models import Stickynote, Colour, StickyGroup, Sticky_Collaboraters, Friends

#The model registered in admin.site.register(..) can be either a single
#model or an iteratble list

myModels = [Stickynote,Colour,StickyGroup,Sticky_Collaboraters,Friends]
admin.site.register(myModels)
