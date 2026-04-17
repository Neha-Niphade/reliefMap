from django.urls import path
from . import views

urlpatterns = [
    path('triage/', views.AI_TriageView.as_view(), name='ai_triage'),
    path('chatbot/', views.AI_ChatbotView.as_view(), name='ai_chatbot'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    # Chat API
    path('threads/', views.ListThreadsView.as_view(), name='list_threads'),
    path('messages/<str:thread_id>/', views.ListMessagesView.as_view(), name='list_messages'),
    path('send-message/', views.SendMessageView.as_view(), name='send_message'),
    path('accept-request/', views.AcceptRequestView.as_view(), name='accept_request'),
]
