from django.db import models
from django.utils import timezone
from stickynote.models import Stickynote

# Create your models here.
#Friends
class Friend(models.Model):
    user1 = models.ForeignKey( #the one who took the initiative to make a request
            'auth.User',
            on_delete=models.CASCADE,
            related_name="user1",
            )
    user2 = models.ForeignKey( #the one who was sent the request
            'auth.User',
            on_delete=models.CASCADE,
            related_name="user2",
            )

#Collaboraters (I.e. those who can view AND edit a specific stickynote)
class Collaborator(models.Model):
    user = models.ForeignKey(
            'auth.User',
            on_delete=models.CASCADE,
            )
    stickynote = models.ForeignKey(
            'stickynote.Stickynote',
            on_delete=models.CASCADE,
            )
    viewOnly = models.BooleanField(default=True) #Add specific people that can view your sticky as opposed to all your friends
    hidden = models.BooleanField(default=False) #allow hidden collaboraters (only the author of the sticky can view hidden collaboraters)

class FriendRequest(models.Model):
    sender = models.ForeignKey( #the one who took the initiative to make a request
            'auth.User',
            on_delete=models.CASCADE,
            related_name="sender",
            )
    receiver = models.ForeignKey( #the one who was sent the request
            'auth.User',
            on_delete=models.CASCADE,
            related_name="receiver",
            )
    status= models.CharField(max_length=20) #whether the request has been accepted
    created_date = models.DateTimeField(default=timezone.now)