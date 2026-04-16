import os
import django
import uuid
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import ChatThread, ChatMessage, HelpRequest
from django.contrib.auth.models import User

def create_mock_chat():
    user, _ = User.objects.get_or_create(username='testuser', email='test@example.com')
    req, _ = HelpRequest.objects.get_or_create(
        id='mock_req_123',
        defaults={
            'category': 'medical',
            'description': 'Mock emergency for UI testing',
            'latitude': 18.5204, 'longitude': 73.8567,
            'urgency': 'critical', 'status': 'accepted',
            'firebase_user_id': 'b744eaf0-c932-4968-96f2-02210f05b90f'
        }
    )
    thread_id = "t_b744eaf0-c932-4968-96f2-02210f05b90f_helper123"
    thread, created = ChatThread.objects.get_or_create(
        id=thread_id,
        defaults={
            'request': req,
            'participants': ['b744eaf0-c932-4968-96f2-02210f05b90f', 'helper123'],
            'last_message': 'System: UI Mock Thread Initialized'
        }
    )
    ChatMessage.objects.create(
        thread=thread,
        sender_id='helper123',
        sender_name='System Volunteer',
        content='Hello! This is a mock message to verify the UI migration is working.'
    )
    print(f"Mock Chat Created: {thread_id}")

if __name__ == '__main__':
    create_mock_chat()
