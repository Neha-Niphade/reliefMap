from django.contrib import admin
from .models import UserProfile, Helper, HelpRequest, ChatThread, ChatMessage

admin.site.register(UserProfile)
admin.site.register(Helper)
admin.site.register(HelpRequest)
admin.site.register(ChatThread)
admin.site.register(ChatMessage)
