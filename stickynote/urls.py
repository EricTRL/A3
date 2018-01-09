from django.urls import path, include
from . import views
from django.contrib import admin
from django.contrib.auth import views as auth_views
from rest_framework.urlpatterns import format_suffix_patterns #REST API

app_name = "stickynote"

urlpatterns = [
    path('', views.page_load, name='page_load'),
    path('ajax/retrieve_sticky_colours/', views.retrieve_sticky_colours, name='retrieve_sticky_colours'),
    path('ajax/get_colour_rgb/', views.get_colour_rgb, name='get_colour_rgb'),
    path('ajax/get_random_colour/', views.get_random_colour, name='get_random_colour'),
    path('ajax/user_login/', views.user_login, name='user_login'),
    path('ajax/user_logout/', views.user_logout, name='user_logout'),
    path('ajax/retrieve_current_user_data/', views.retrieve_current_user_data, name='retrieve_current_user_data'),
    path('ajax/delete_sticky_by_id/', views.delete_sticky_by_id, name='delete_sticky_by_id'),
    path('ajax/create_stickies/', views.create_stickies, name='create_stickies'),
    path('ajax/user_is_authenticated/', views.user_is_authenticated, name='user_is_authenticated'),

    #REST API
    path('stickies/', views.StickynoteList.as_view()),
    path('stickies/<int:id>/', views.StickynoteDetails.as_view()),
    path('stickies/user/<int:author_id>/', views.StickynoteAuthorList.as_view()),
    path('colours/', views.ColourList.as_view()),
    path('colours/<int:id>/', views.ColourDetails.as_view()),
    path('users/', views.UserList.as_view()),
    path('users/<int:id>', views.UserDetails.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
