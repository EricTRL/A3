from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

class UpdateAccountForm(UserChangeForm):

    class Meta: 
        model = User
        fields = (
        'first_name',
        'last_name',
        'username',
        'password'
        )

    def clean_password(self):
    	return self.initial.get("password")
