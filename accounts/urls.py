from django.conf.urls import url
from . import views

app_name="accounts"

urlpatterns = [
    url(r'^signup/$', views.signup_view, name='signup'),
    url(r'^login/$', views.login_view, name='login'),
    url(r'^logout/$', views.logout_view, name='logout'),
    url(r'^profile/edit', views.edit_profile, name='edit_profile'),
    url(r'^profile/', views.profile_view, name='profile'),
    url(r'^password/$', views.change_password, name='change_password'),

]