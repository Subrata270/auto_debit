# Quick Start - Firebase Setup

## Immediate Action Required ⚠️

I've created a `.env.local` file with placeholder values to prevent the app from crashing. However, **you MUST replace these with your actual Firebase credentials** for the app to work properly.

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Enter project name: `auto-debit-tracker` (or any name you prefer)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register app with a nickname (e.g., "Auto Debit Web")
6. Copy the `firebaseConfig` object values

### Step 3: Enable Authentication

1. In Firebase Console left sidebar, click "Authentication"
2. Click "Get started"
3. Click on "Sign-in method" tab
4. Click on "Email/Password"
5. Toggle "Enable" to ON
6. Click "Save"

### Step 4: Create Firestore Database

1. In Firebase Console left sidebar, click "Firestore Database"
2. Click "Create database"
3. Select "Start in **test mode**" (you can secure it later)
4. Choose a location (select closest to your users)
5. Click "Enable"

### Step 5: Update .env.local File

1. Open `.env.local` in your project root
2. Replace the placeholder values with your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX  # from firebaseConfig
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

3. Save the file

### Step 6: Restart Dev Server

```bash
# Stop the current server (Ctrl+C or Cmd+C)
npm run dev
```

## Testing

Once configured:

1. Go to `/register` page
2. Create a new account
3. Check Firebase Console > Authentication to see your new user
4. Login with your credentials
5. Check Firebase Console > Firestore Database to see your data

## Troubleshooting

**Still seeing errors?**

- Make sure you've restarted the dev server after updating `.env.local`
- Double-check there are no extra spaces in `.env.local`
- Verify Authentication (Email/Password) is enabled in Firebase
- Verify Firestore Database is created
- Check browser console for specific error messages

**Need more help?**

- See `FIREBASE_SETUP.md` for detailed step-by-step instructions with screenshots
- Check Firebase documentation: https://firebase.google.com/docs

## Current Status

✅ Firebase integration code is ready
✅ .env.local file created with placeholders
⚠️ **YOU NEED TO**: Add your actual Firebase credentials
⚠️ **YOU NEED TO**: Enable Authentication in Firebase Console
⚠️ **YOU NEED TO**: Create Firestore Database in Firebase Console

The app will show a warning in the console until you complete these steps.
