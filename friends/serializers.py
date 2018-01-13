from rest_framework import serializers
from stickynote.models import Stickynote, Colour
from django.contrib.auth.models import User


class ColourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Colour
        fields = ('id', 'name', 'r', 'g', 'b', 'a')

class StickynoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stickynote
        fields = ('title', 'contents', 'author', 'colour', 'created_date', 'last_edit_date', 'shared')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'date_joined', 'is_active', 'is_staff', 'is_superuser')
