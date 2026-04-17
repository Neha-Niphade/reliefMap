import os
import json
import uuid
import hashlib
from datetime import datetime
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai
from core.firebase import get_firestore_client
from .rate_limiting import user_rate_limiter
from .models import UserProfile, Helper, HelpRequest, ChatThread, ChatMessage

class AI_TriageView(APIView):
    """
    Endpoint for predicting SOS urgency and categorizing requests via Gemini.
    """
    def post(self, request):
        data = request.data
        user_message = data.get('message', '')
        user_id = data.get('userId', 'anonymous')
        location = data.get('location', {})
        
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # ── Rate limit: per user (sliding window) ───────────────────────────
        user_allowed, user_retry = user_rate_limiter.is_allowed(user_id)
        if not user_allowed:
            return Response(
                {
                    "error": "Too many requests. You have reached the SOS submission limit.",
                    "retry_after": user_retry,
                    "limit_type": "user",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        
        genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
        model = genai.GenerativeModel('gemini-2.5-flash') # Recommended model        
        prompt = f"""
        You are an emergency triage AI for the Relief-Map hyper-local system.
        Analyze the following emergency request from a user: "{user_message}"
        Consider factors like keywords, user vulnerability, and situational danger.
        
        Classify it and return ONLY a valid JSON object with these exact keys:
        - "category": (Medical, Rescue, Women Safety, Fire, General)
        - "urgency": (Critical, High, Medium, Low)
        - "priority_score": (integer 1-100, where 100 is maximum life-threatening severity)
        - "summary": (A concise, 1-sentence version of their issue)
        """
        
        DEFAULT_TRIAGE_MAP = {
            "Medical": {
                "urgency": "Critical", "score": 90, 
                "summary": "Medical emergency reported. Dispatching immediate first-aid coordination and alerting nearby medical personnel."
            },
            "Fire": {
                "urgency": "Critical", "score": 95, 
                "summary": "Fire or explosion hazard reported. Alerting local fire safety nodes and evacuating nearby personnel."
            },
            "Rescue": {
                "urgency": "High", "score": 85, 
                "summary": "Rescue/Extraction request. Sending nearby able-bodied volunteers for search and navigation support."
            },
            "Women Safety": {
                "urgency": "Critical", "score": 92, 
                "summary": "Women's safety alert. Sending immediate high-priority signal to nearby safety volunteers and law enforcement."
            },
            "Danger": {
                "urgency": "Critical", "score": 100,
                "summary": "Immediate life-threat or danger reported. Escalating to highest response tier immediately."
            },
            "General": {
                "urgency": "High", "score": 60, 
                "summary": "General emergency assistance requested. Triage ongoing by local responders."
            }
        }

        is_predefined = data.get('isPredefined', False)
        ai_data = None

        if is_predefined:
            cat_key = data.get('category', 'General').title()
            fallback = DEFAULT_TRIAGE_MAP.get(cat_key, DEFAULT_TRIAGE_MAP['General'])
            ai_data = {
                "category": cat_key,
                "urgency": fallback['urgency'],
                "priority_score": fallback['score'],
                "summary": fallback['summary']
            }
            print(f"Bypassing AI for predefined scenario: {cat_key}")

        if not ai_data:
            try:
                response = model.generate_content(prompt)
                text = response.text.replace("```json", "").replace("```", "").strip()
                ai_data = json.loads(text)
            except Exception as ai_err:
                # Gemini quota exceeded or API failure — use safe fallback triage with category intelligence
                print(f"Gemini triage failed (Quota/API), using intelligent fallback: {ai_err}")
                cat_key = data.get('category', 'General').title()
                fallback = DEFAULT_TRIAGE_MAP.get(cat_key, DEFAULT_TRIAGE_MAP['General'])
                
                ai_data = {
                    "category": cat_key,
                    "urgency": fallback['urgency'],
                    "priority_score": fallback['score'],
                    "summary": f"[AI OFFLINE] {fallback['summary']} {user_message[:100]}"
                }

        # ── Always write to Firestore (even if AI failed) ──────────────
        p_score = ai_data.get('priority_score', 50)
        urgency = ai_data.get('urgency', 'High')
        import random
        loc_risk = random.randint(1, 10)

        try:
            db = get_firestore_client()
            if db:
                post_ref = db.collection('posts').document()
                post_data = {
                    "id": post_ref.id,
                    "type": "request",
                    "category": ai_data.get('category'),
                    "description": ai_data.get('summary') + " | Original: " + user_message,
                    "location": location,
                    "urgency": urgency,
                    "priority_level": urgency,
                    "priority_score": p_score,
                    "escalation_stage": 0,
                    "location_risk_score": loc_risk,
                    "status": "Requested",
                    "userId": user_id,
                    "createdAt": timezone.now().isoformat()
                }
                post_ref.set(post_data)

            return Response({"success": True, "ai_triage": ai_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AI_ChatbotView(APIView):
    """
    Endpoint for standard AI Chatbot queries (like "what should I do in an earthquake?")
    """
    def post(self, request):
        query = request.data.get('query', '')
        
        if not query:
            return Response({"error": "Query required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
            model = genai.GenerativeModel('gemini-2.5-flash')
            prompt = f"You are an emergency safety assistant for Relief-Map. Please help the user concisely: {query}"
            
            response = model.generate_content(prompt)
            return Response({"reply": response.text.strip()}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ListThreadsView(APIView):
    """
    Returns all chat threads where the user is a participant.
    """
    def get(self, request):
        user_id = request.query_params.get('userId')
        if not user_id:
            return Response({"error": "User ID required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # JSONField check for SQLite (falling back to icontains string-match)
        threads = ChatThread.objects.filter(participants__icontains=user_id).order_by('-updated_at')
        
        data = []
        for t in threads:
            data.append({
                "id": t.id,
                "requestId": t.request.id,
                "participantIds": t.participants,
                "lastMessage": t.last_message,
                "updatedAt": t.updated_at.isoformat()
            })
        return Response(data, status=status.HTTP_200_OK)

class ListMessagesView(APIView):
    """
    Returns all messages for a specific chat thread.
    """
    def get(self, request, thread_id):
        messages = ChatMessage.objects.filter(thread_id=thread_id).order_by('timestamp')
        data = []
        for m in messages:
            data.append({
                "id": m.id,
                "senderId": m.sender_id,
                "content": m.content,
                "timestamp": m.timestamp.isoformat(),
                "isAi": m.is_ai
            })
        return Response(data, status=status.HTTP_200_OK)

class SendMessageView(APIView):
    """
    Saves a message to the database and updates the thread summary.
    """
    def post(self, request):
        data = request.data
        thread_id = data.get('threadId')
        sender_id = data.get('senderId')
        content = data.get('content')
        sender_name = data.get('senderName', 'Responder')
        
        if not all([thread_id, sender_id, content]):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            thread = ChatThread.objects.get(id=thread_id)
            msg = ChatMessage.objects.create(
                thread=thread,
                sender_id=sender_id,
                sender_name=sender_name,
                content=content
            )
            
            # Update thread metadata
            thread.last_message = content
            thread.save() # Triggers auto_now update_at
            
            return Response({
                "success": True, 
                "messageId": msg.id,
                "timestamp": msg.timestamp.isoformat()
            }, status=status.HTTP_201_CREATED)
        except ChatThread.DoesNotExist:
            return Response({"error": "Thread not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AcceptRequestView(APIView):
    """
    Syncs the 'Accept' action from frontend to local DB.
    Creates the HelpRequest record if missing and initializes the ChatThread.
    """
    def post(self, request):
        data = request.data
        req_id = data.get('requestId')
        helper_id = data.get('helperId')
        requester_id = data.get('requesterId')
        
        if not all([req_id, helper_id, requester_id]):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # 1. Ensure HelpRequest exists locally (minimal record for thread FK)
            help_req, created = HelpRequest.objects.get_or_create(
                id=req_id,
                defaults={
                    'category': 'rescue',
                    'description': 'Accepted via Dashboard',
                    'latitude': 0, 'longitude': 0,
                    'urgency': 'high',
                    'status': 'accepted',
                    'firebase_user_id': requester_id
                }
            )
            
            # 2. Initialize or Update Thread
            thread_id = f"t_{requester_id}_{helper_id}"
            thread, t_created = ChatThread.objects.get_or_create(
                id=thread_id,
                defaults={
                    'request': help_req,
                    'participants': [requester_id, helper_id],
                    'last_message': "System: Volunteer is on the way."
                }
            )
            
            return Response({
                "success": True, 
                "threadId": thread.id,
                "message": "Local thread synchronized"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        
        if not email or not password or not name:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        db = get_firestore_client()
        if not db:
            return Response({"error": "Database unavailable"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # Handle firestore library API version differences cleanly
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            existing = db.collection('users').where(filter=FieldFilter("email", "==", email)).get()
        except ImportError:
            existing = db.collection('users').where("email", "==", email).get()
            
        if existing:
            return Response({"error": "User setup already exists for this email!"}, status=status.HTTP_400_BAD_REQUEST)

        user_id = str(uuid.uuid4())
        hashed_pw = hashlib.sha256(password.encode()).hexdigest()
        
        # We merge Helper into Users uniformly
        user_data = {
            "id": user_id,
            "email": email,
            "name": name,
            "password_hash": hashed_pw, # Minimal demonstration
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "isAvailable": False,
            "location": {"lat": 0.0, "lng": 0.0},
            "skills": []
        }
        
        db.collection('users').document(user_id).set(user_data)
            
        return Response({"success": True, "userId": user_id}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
            
        db = get_firestore_client()
        hashed_pw = hashlib.sha256(password.encode()).hexdigest()
        
        try:
            from google.cloud.firestore_v1.base_query import FieldFilter
            users = db.collection('users').where(filter=FieldFilter("email", "==", email)).where(filter=FieldFilter("password_hash", "==", hashed_pw)).get()
        except ImportError:
            users = db.collection('users').where("email", "==", email).where("password_hash", "==", hashed_pw).get()
        
        if not users:
            return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user_doc = users[0].to_dict()
        return Response({
            "success": True, 
            "userId": user_doc.get("id"),
            "name": user_doc.get("name")
        }, status=status.HTTP_200_OK)
