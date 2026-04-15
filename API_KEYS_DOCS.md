# API Keys and Configuration Guide

This document explains how to obtain and configure the necessary API keys for the Relief-Map platform.

## 1. Firebase (Realtime Database & Authentication)
Firebase will be used for real-time synchronization on the frontend and data storage.

**How to get the keys:**
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project** (name it "relief-map").
3. Once the project is created, click the **Web (</>)** icon on the project overview page to register a web app.
4. Firebase will show you a configuration object (`firebaseConfig`).
5. Copy these values into your `Frontend/.env` file.

**For the Django Backend (Admin SDK):**
1. In the Firebase console, go to **Project settings** (gear icon) -> **Service accounts**.
2. Click **Generate new private key**.
3. This will download a `.json` file.
4. Rename this file to `firebase-adminsdk.json` and place it in the `Backend/` directory.
5. Provide this path in your `Backend/.env` file.

## 2. Real-Time Maps (Leaflet - No API Key Required)
The frontend uses **Leaflet** with OpenStreetMap. It is 100% free and open-source! You do not need any API key for the map functionality.

## 3. Google Gemini API (For AI Triage & Support)
Used in the Django backend to parse SOS voice requests, perform triage, and run the chatbot assistant.

**How to get the keys:**
1. Go to the [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **Get API key** in the left sidebar.
4. Click **Create API key**.
5. Copy this API Key and paste it into your `Backend/.env` file.
