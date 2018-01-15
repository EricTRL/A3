from django.contrib.auth.models import User #the user DB table
from stickynote.models import Stickynote, Colour, Group #DB tables
from friends.models import Friend, Collaborator, FriendRequest
from django.utils import timezone #timezone-data

from django.db.models import Q #Allow OR-lookups
from random import randint #random number generator

################################################################################
#Colour-related:

#get a random sticky colour from those in the DB
def GetRandomColour():
    iRandomIndex = randint(0, Colour.objects.count() - 1);
    pRandomColour = Colour.objects.all()[iRandomIndex];
    return pRandomColour;

################################################################################
#Permission/User-related

#returns true if a given user can open a given stickynote. returns false otherwise
def CanOpenStickynote(iStickyID, iUserID):
    #author of a stickynote can always open
    b1 = Stickynote.objects.filter(id=iStickyID, group_id__author_id=iUserID).exists();
    #Other user can open if he's friends with the author + the sticky OR group is shared
    pSticky = Stickynote.objects.get(id=iStickyID);
    pGroup = Group.objects.get(id=pSticky.group_id);
    b2 = UsersAreFriends(iUserID, pGroup.author_id) and (pGroup.shared or pSticky.shared);
    return b1 or b2;

#returns true if a given user can EDIT a given stickynote. returns false otherwise
def CanEditStickynote(iStickyID, iUserID):
    #Only the author can edit
    return Stickynote.objects.filter(id=iStickyID, group_id__author_id=iUserID).exists();

################################################################################
#Friends/User-related

#Returns true if two given users are friends. returns false otherwise
def UsersAreFriends(user1, user2):
    return Friend.objects.filter(Q(user1_id=user1, user2_id=user2) | Q(user1_id=user2, user2_id=user1)).exists()


#Valid statuses for friend requests
tValidStatuses = ["PENDING","ACCEPTED","DENIED"];

#Updates the state of a Friend request from a given user to another user. Assumes that such a request exists;
#returns true if the given users successfully became friends. returns false otherwise
def UpdateFriendRequestStatus(iUserSender, iUserReceiver, sStatus):
    if (sStatus in tValidStatuses):
        pRequest = FriendRequest.objects.get(status="PENDING", sender=iUserSender, receiver=iUserReceiver);
        pRequest.status = sStatus;
        pRequest.save();

        #Only become friends if we actually accept and we aren't friends yet
        if sStatus == "ACCEPTED" and not UsersAreFriends(iUserSender,iUserReceiver):
            Friend.objects.create(user1_id=iUserSender, user2_id=iUserReceiver, friended_date=timezone.now());
            return True;
    return False;


#comment here to prevent Atom from remvoing these lines
