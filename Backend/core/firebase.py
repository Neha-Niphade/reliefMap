import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from django.conf import settings

def get_firestore_client():
    if not firebase_admin._apps:
        # Load the credentials from the path specified in .env
        cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH', 'firebase-adminsdk.json')
        full_path = os.path.join(settings.BASE_DIR, cred_path)
        
        if os.path.exists(full_path):
            cred = credentials.Certificate(full_path)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback for development if file is missing (to prevent crash on startup)
            print(f"Warning: Firebase credentials not found at {full_path}")
            
    try:
        return firestore.client()
    except Exception as e:
        print(f"Firestore exception: {e}")
        return None
