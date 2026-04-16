# 🆘 Relief-Map: Hyper-Local Emergency Aid Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Stack: React/Firebase/Django](https://img.shields.io/badge/Stack-React%20%7C%20Firebase%20%7C%20Django-blue.svg)](https://github.com/Neha-Niphade/reliefMap)
[![AI: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)

**Relief-Map** is a mission-critical, real-time emergency response platform designed to bridge the gap between citizens in distress and nearby verified volunteers. By leveraging hyper-local geolocation, AI-driven triage, and offline resilience layers, the platform decentralizes emergency management, allowing communities to protect themselves when seconds count.

---

## 🏗️ System Architecture & Tech Stack

The application utilizes a sophisticated bifurcated architecture, ensuring high-frequency data synchronization and AI intelligence.

### **Frontend (The Command Center)**
- **Core:** React 18 (Vite) / TypeScript
- **Styling:** Tailwind CSS / Framer Motion (Premium Animations) / Radix UI
- **Mapping:** `@vis.gl/react-google-maps` (Advanced Markers & Heatmaps)
- **i18n:** `i18next` (Multilingual support for 8+ regional languages)
- **Offline Sync:** **IndexedDB** for local request queuing and SMS fallback.
- **State:** Firebase Web SDK (Real-time Firestore listeners)

### **Backend (The Intelligent Core)**
- **Framework:** Python 3.10+ / Django REST Framework
- **Identity:** Firebase Auth / Admin SDK
- **AI Processing:** Google Gemini 1.5 (Automated Triage & Priority Escalation)
- **Database:** Firebase Firestore (NoSQL)

---

## 🌟 Key Features

### 🚀 **Real-Time SOS & AI Triage**
One-tap SOS broadcast that uses **Gemini AI** to instantly analyze voice/text notes, categorize the emergency (Medical, Fire, Rescue, etc.), and assign urgency levels.

### 📶 **Offline SMS Fallback**
World-first disaster resilience layer. If internet connectivity is lost, SOS signals are automatically routed via **SMS intents** and queued in **IndexedDB** for background sync once the grid returns.

### 🗺️ **Admin Crisis Heatmap**
A high-performance geospatial analytics dashboard for authorities, showing real-time hotspot density, volunteer distribution, and "Active Hits" per 3km².

### 🔔 **High-Priority Escalation**
Automated monitoring system that detects unresolved critical cases and escalates them to government/NGO authorities within 2-10 minutes of inactivity.

### 🌍 **Multilingual Ecosystem**
Fully translated interface supporting English, Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, and Gujarati.

---

## 🛠️ Installation & Running Locally

### **1. Prerequisites**
- **Node.js**: v18.0.0+
- **Python**: v3.10.x+
- **Firebase Project**: Setup Firestore & Authentication.
- **API Keys**: Google Maps API Key, Google Gemini API Key.

### **2. Environment Secrets**
You MUST set up environment variables in both directories.

#### **Backend (`/Backend/.env`)**
```env
GEMINI_API_KEY=your_gemini_key
# Place your firebase-adminsdk.json in the /Backend folder
```

#### **Frontend (`/Frontend/.env`)**
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_API_URL=http://localhost:8000
```

### **3. Execution Protocol**

#### **🚀 Start the Backend**
```bash
cd Backend
python -m venv venv
# Activate: venv\Scripts\activate (Win) or source venv/activate (Unix)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### **💻 Start the Frontend**
```bash
cd Frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```text
reliefMap/
├── Frontend/           # React + Vite Client
│   ├── src/
│   │   ├── components/ # Heatmaps, SOS, Offline Layers
│   │   ├── hooks/      # Network status, User Tracking
│   │   └── services/   # Offline Queue (IndexedDB)
│   └── .env.example    # Configuration template
├── Backend/            # Django + AI Logic
│   ├── triage/         # Gemini Triage Engine
│   └── .env.example    # API Key template
└── README.md           # Core Documentation
```

---

## 📜 Project Documentation
- **[SETUP.md](./SETUP.md)**: Detailed configuration and troubleshooting.
- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Standards for pull requests and code style.
- **[PRD](./PRD)**: Original Product Requirements Document.

---

**Developed for Crisis Resilience & Community Safety.**
*(Open Source Initiative)*
