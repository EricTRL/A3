from django.conf.urls import url
from . import views

app_name = "friends"

urlpatterns = [

    url(r'^friends/$', views.friends_page, name='friends_page'),

    #TODO: OLD (to be removed probably)
    #path('ajax/retrieve_sticky_colours/', views.retrieve_sticky_colours, name='retrieve_sticky_colours'),
    #path('ajax/retrieve_current_user_data/', views.retrieve_current_user_data, name='retrieve_current_user_data'),
    #path('ajax/create_stickies/', views.create_stickies, name='create_stickies'),

]
