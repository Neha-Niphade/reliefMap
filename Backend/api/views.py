import os
import json
import uuid
import hashlib
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai
from core.firebase import get_firestore_client

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
            
        genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
        model = genai.GenerativeModel('gemini-2.5-flash') # Recommended model        
        prompt = f"""
        You are an emergency triage AI for the Relief-Map hyper-local system.
        Analyze the following emergency request from a user: "{user_message}"
        
        Classify it and return ONLY a valid JSON object with these keys:
        - "category": (e.g., Medical, Rescue, Women Safety, Fire, General)
        - "urgency": (Critical, High, Medium, Low)
        - "summary": (A concise, 1-sentence version of their issue)
        """
        
        try:
            response = model.generate_content(prompt)
            # Clean up potential markdown formatting in response
            text = response.text.replace("```json", "").replace("```", "").strip()
            ai_data = json.loads(text)
            
            # Prepare post for Firestore
            db = get_firestore_client()
            if db:
                post_ref = db.collection('posts').document()
                post_data = {
                    "id": post_ref.id,
                    "type": "request",
                    "category": ai_data.get('category'),
                    "description": ai_data.get('summary') + " | Original: " + user_message,
                    "location": location,
                    "urgency": ai_data.get('urgency'),
                    "status": "Requested",
                    "userId": user_id,
                    "createdAt": datetime.utcnow().isoformat() + "Z"
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
