from django.db import models
from django.utils import timezone
from django.core.validators import MaxValueValidator, MinValueValidator

#Stickynote entry (yes, most of this is unused (or not displayed to the user), though it could be used in A3)
class Stickynote(models.Model):
    author = models.ForeignKey(
            'auth.User',
            on_delete=models.CASCADE,
            )
    title = models.CharField(max_length=200)
    contents = models.TextField()
    created_date = models.DateTimeField(
            default=timezone.now)
    last_edit_date = models.DateTimeField(
            blank=True, null=True)
    colour = models.ForeignKey(
            'Colour',
            on_delete=models.CASCADE,
            )
    group = models.ForeignKey(
            'StickyGroup',
            on_delete=models.CASCADE,
            default = 1,
    )
    shared = models.BooleanField()

    def create(self):
        self.published_date = timezone.now()
        self.save()

    def save_edits(self):
        self.last_edit_date = timezone.now()
        self.save()

    def __str__(self):
        return self.title

#Colour entry
class Colour(models.Model):
    name = models.CharField(max_length=20)
    r = models.IntegerField(
            default=0,
            validators=[MaxValueValidator(255), MinValueValidator(0)],
    )
    g = models.IntegerField(
            default=0,
            validators=[MaxValueValidator(255), MinValueValidator(0)],
    )
    b = models.IntegerField(
            default=0,
            validators=[MaxValueValidator(255), MinValueValidator(0)],
    )
    a = models.IntegerField(
            default=255,
            validators=[MaxValueValidator(255), MinValueValidator(0)],
    )

    def __str__(self):
        return self.name

#Friends
class Friends(models.Model):
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
    accepted = models.BooleanField(default=False) #whether the request has been accepted

#Collaboraters (I.e. those who can view AND edit a specific stickynote)
class Sticky_Collaboraters(models.Model):
    user = models.ForeignKey(
            'auth.User',
            on_delete=models.CASCADE,
            )
    stickynote = models.ForeignKey(
            'Stickynote',
            on_delete=models.CASCADE,
            )
    viewOnly = models.BooleanField(default=True)
    hidden = models.BooleanField(default=False) #allow hidden collaboraters (only the author of the sticky can view hidden collaboraters)

#Stickynote Group Entry
class StickyGroup(models.Model):
    author = models.ForeignKey(
            'auth.User',
            on_delete=models.CASCADE,
            )
    title = models.CharField(max_length=200)
    created_date = models.DateTimeField( #Creation Date
            default=timezone.now)
    last_edit_date = models.DateTimeField( #Last date something was added/removed from this group
            blank=True, null=True)
    shared = models.BooleanField()
    cannotBeDeleted = models.BooleanField(default=False)

    def create(self):
        self.published_date = timezone.now()
        self.save()

    def save_edits(self):
        self.last_edit_date = timezone.now()
        self.save()

    def __str__(self):
        return self.title
