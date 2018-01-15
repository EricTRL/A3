from django.conf.urls import url
from django.urls import path, include
from . import views

app_name = "friends"

urlpatterns = [

    url(r'^friends/$', views.friends_page, name='friends_page'),
    url(r'^friends/(?P<friend_id>\d+)$', views.view_friend, name='view_friend'),
    url(r'^noneshared$', views.noneshared, name='noneshared'),
    url(r'^remove_friend/(?P<friend_pk>\d+)$', views.remove_friend, name='remove_friend'),
    url(r'^search_friend$', views.search_friend, name='search_friend'),

    path('ajax/get_users_by_names/', views.get_users_by_names, name='get_users_by_names'),
    path('ajax/send_friend_request/', views.send_friend_request, name='send_friend_request'),
    path('ajax/respond_friend_request/', views.respond_friend_request, name='respond_friend_request'),

]
