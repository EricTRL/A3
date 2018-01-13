from django.conf.urls import url
from django.urls import path, include
from . import views

app_name = "friends"

urlpatterns = [

    url(r'^friends/$', views.friends_page, name='friends_page'),

    path('ajax/get_users_by_names/', views.get_users_by_names, name='get_users_by_names'),
    path('ajax/send_friend_request/', views.send_friend_request, name='send_friend_request'),
    path('ajax/respond_friend_request/', views.respond_friend_request, name='respond_friend_request'),

]
