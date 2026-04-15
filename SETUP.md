# Setup & Installation Guide

This document outlines the requisite steps to configure, build, and deploy the Relief-Map framework iteratively in a local development environment.

## 1. Prerequisite Tooling

To ensure architectural compatibility, verify the host system has the following binaries accessible:
- **Node.js**: Minimum version `v18.x.x`
- **Python**: Minimum version `v3.10.x`
- **Firebase Infrastructure**: An active Google Cloud Firebase Project comprising Firestore databases and Authentication services.
- **Google Gemini**: A developer API token provisioning LLM access.

---

## 2. Environment Configuration Maps

You must establish localized `.env` configurations in both environments for runtime compilation. We have provided template files matching the expected schemas.

### 2.1. Backend Secrets configuration
1. Navigate to the `Backend` directory.
2. Duplicate the `Backend/.env.example` file and rename the cloned file to precisely `.env`.
3. Inject your Google Gemini API Key into the declared variable format.
4. Download your `firebase-adminsdk.json` service account file from the Firebase Console, and place it explicitly within the `Backend/` root folder.

### 2.2. Frontend Secrets configuration
1. Navigate to the `Frontend` directory.
2. Duplicate the `Frontend/.env.example` file and rename it to `.env`.
3. Populate the `VITE_FIREBASE_*` configuration strings utilizing the web config credentials supplied by your Firebase Project settings.

---

## 3. Backend Deployment (Django / Python)

1. Open your terminal abstraction and navigate to the backend directory:
   `cd Backend`

2. Instantiate an isolated Python virtual environment:
   `python -m venv venv`
   
3. Activate the virtual environment context:
   - **Windows OS**: `venv\Scripts\activate`
   - **Unix (Linux/Mac)**: `source venv/bin/activate`

4. Hydrate the environment with the required dependencies:
   `pip install -r requirements.txt`

5. Initialize the SQLite relational layers and execute Django database migrations:
   `python manage.py makemigrations`
   `python manage.py migrate`

6. Initiate the development server instance:
   `python manage.py runserver`
   
*(The server defaults to binding against port TCP `8000`)*

---

## 4. Frontend Deployment (React / Vite)

1. Provision a secondary terminal instance.
2. Navigate to the frontend directory:
   `cd Frontend`

3. Install the NPM package graph dependencies:
   `npm install`

4. Initiate the Vite Hot-Module-Replacement (HMR) development server:
   `npm run dev`

*(The client framework will compile the TypeScript definitions and broadcast normally on TCP port `8080` (or `5173` if occupied))*

---

## 5. Verification Check

To conclude the installation protocol, execute the following validations:
1. Traverse your browser to the designated frontend URL (e.g., `http://localhost:8080`).
2. Utilize the `/auth` interface to register a client record.
3. Access the Dashboard interface to visually verify the Leaflet Cartography module initialization.
4. Submit a standardized SOS Ticket to ensure Django correctly bridges the payload to the Gemini API layer and subsequently writes state to Firestore.
