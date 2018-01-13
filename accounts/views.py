from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm, PasswordChangeForm, UserChangeForm
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required #require users to be logged in to view page
from django.contrib import messages
from django.contrib.auth.models import User

from accounts.forms import UpdateAccountForm, FirstLastNameForm
from stickynote.models import Group

# Create your views here.

def signup_view(request):
	if request.method == "POST":
		form = UserCreationForm(request.POST)
		formNames = FirstLastNameForm(request.POST)
		if form.is_valid():
			if formNames.is_valid():
				user = form.save(commit=False)
				user.first_name = formNames.cleaned_data['first_name']
				user.last_name = formNames.cleaned_data['last_name']
				user.save()
				# create a general, undeletable group to have a starting sticky
				group = Group.objects.create(title='General', author=user, shared = False, cannotBeDeleted = True)
				# log the user in here!
				login(request, user)
				return redirect('stickynote:page_load')
	else:
		form = UserCreationForm()
		formNames = FirstLastNameForm()
	return render(request, 'accounts/signup.html', {'form': form, 'formNames': formNames})

def login_view(request):
	if request.method == "POST":
		form= AuthenticationForm(data=request.POST)
		if form.is_valid():
			#log the user in here!
			user = form.get_user()
			login(request, user)
			return redirect('stickynote:page_load')
	else:
		form = AuthenticationForm()
	return render(request, 'accounts/login.html', {'form': form})

def logout_view(request):
	if request.method == "POST":
		logout(request)
		return redirect('stickynote:page_load')

def remove_view(request):
	if request.method == "POST":
		logout(request)
		return redirect('stickynote:page_load')

#Profile page
@login_required
def profile_view(request):
	return render(request, 'accounts/profile.html')

#Change password
@login_required
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)  # Important!
            messages.success(request, 'Your password was successfully updated!')
            return redirect('accounts:profile')
        else:
            messages.error(request, 'Please correct the error below.')
    else:
        form = PasswordChangeForm(request.user)
    return render(request, 'accounts/change_password.html', {'form': form})

@login_required
def edit_profile(request):
    if request.method == "POST":
        form = UpdateAccountForm(request.POST, instance=request.user)
        if form.is_valid():
            user = form.save()
            messages.success(request, 'Your profile was successfully updated!')
            return redirect('accounts:profile')
        else:
            messages.error(request, 'Please correct the error below.')
    else:
        form = UpdateAccountForm(instance=request.user)
    return render(request, 'accounts/edit_profile.html', {'form': form})