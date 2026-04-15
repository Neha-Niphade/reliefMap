from django.urls import path
from . import views

urlpatterns = [
    path('triage/', views.AI_TriageView.as_view(), name='ai_triage'),
    path('chatbot/', views.AI_ChatbotView.as_view(), name='ai_chatbot'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
]
