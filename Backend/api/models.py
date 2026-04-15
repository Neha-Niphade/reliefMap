import uuid
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('user', 'User / Victim'),
        ('helper', 'Volunteer / Helper'),
        ('admin', 'Admin / Authority'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    blood_group = models.CharField(max_length=10, null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=100, null=True, blank=True)
    emergency_contact_number = models.CharField(max_length=20, null=True, blank=True)
    
    # Keeping track of location updates for real-time safety
    last_known_latitude = models.FloatField(null=True, blank=True)
    last_known_longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} ({self.role})"

class Helper(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_available = models.BooleanField(default=True)
    skills = models.JSONField(default=list, blank=True, help_text="List of skills e.g. ['First Aid', 'CPR']")

    def __str__(self):
        return self.name

class HelpRequest(models.Model):
    CATEGORY_CHOICES = [
        ('medical', 'Medical'),
        ('danger', 'Danger'),
        ('rescue', 'Rescue'),
        ('women_safety', 'Women Safety'),
        ('elderly', 'Elderly'),
        ('fire', 'Fire'),
        ('flood', 'Flood'),
        ('other', 'Other'),
    ]
    URGENCY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('on_way', 'On Way'),
        ('completed', 'Completed'),
        ('escalated', 'Escalated'),
    ]
    TYPE_CHOICES = [
        ('sos', 'SOS'),
        ('request', 'Request'),
    ]

    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    request_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='request')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    voice_text = models.TextField(null=True, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    firebase_user_id = models.CharField(max_length=255) # Keep for compatibility with mobile/firebase
    user_name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_request_type_display()} - {self.get_category_display()} - {self.status}"

class ChatThread(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(HelpRequest, on_delete=models.CASCADE, related_name='threads')
    participants = models.JSONField(default=list, help_text="List of user/helper IDs") 
    participant_names = models.JSONField(default=list, help_text="List of participant names")
    last_message = models.TextField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Thread {self.id} for Request {self.request.id}"

class ChatMessage(models.Model):
    id = models.CharField(max_length=100, primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(ChatThread, related_name='messages', on_delete=models.CASCADE)
    sender_id = models.CharField(max_length=255)
    sender_name = models.CharField(max_length=255)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_ai = models.BooleanField(default=False)

    def __str__(self):
        return f"Message by {self.sender_name} at {self.timestamp}"
