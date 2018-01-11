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

class FirstLastNameForm(forms.Form):
    first_name = forms.CharField(label='First Name', max_length=100)
    last_name = forms.CharField(label='Last Name', max_length=100, required=False)
