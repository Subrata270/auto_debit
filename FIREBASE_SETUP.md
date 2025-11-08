# Firebase Setup Instructions

## Prerequisites

- A Firebase account (free tier works fine)
- Node.js installed on your machine

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "auto-debit-tracker")
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Enable Firebase Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## Step 3: Create Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can configure security rules later)
4. Select a Cloud Firestore location (choose one closest to your users)
5. Click "Enable"

## Step 4: Get Firebase Configuration

1. In your Firebase project, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "AutoDebit Web App")
6. You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

## Step 5: Configure Environment Variables

1. In your project root, create a file named `.env.local`
2. Copy the contents from `.env.local.example`
3. Replace the placeholder values with your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_from_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 6: Set Up Firestore Security Rules (Optional but Recommended)

1. Go to Firestore Database in Firebase Console
2. Click on the "Rules" tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - authenticated users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Subscriptions - authenticated users can read all, write their own
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Notifications - users can only read their own
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null;
    }
  }
}
```

4. Click "Publish"

## Step 7: Run Your Application

1. Install dependencies (if not already done):

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:9002`

## Testing the Setup

### Register a New User

1. Go to the registration page
2. Fill in all fields:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Role: employee
   - Department: Engineering
3. Click "Create Account"
4. You should be redirected to the login page

### Login

1. Enter the credentials you just created
2. Select the appropriate role portal
3. Click "Login"
4. You should be redirected to the dashboard

## Verifying Data in Firebase

### Check Authentication

1. Go to Firebase Console > Authentication
2. You should see your newly registered user

### Check Firestore

1. Go to Firebase Console > Firestore Database
2. You should see collections:
   - `users` - containing user profiles
   - `subscriptions` - will be populated when users create subscription requests
   - `notifications` - will be populated when system generates notifications

## Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"

- Double-check your API key in `.env.local`
- Make sure there are no extra spaces or quotes

### Error: "Missing or insufficient permissions"

- Check your Firestore security rules
- Make sure you're authenticated before trying to access data

### Data not showing up

- Check browser console for errors
- Verify Firebase configuration is correct
- Make sure you're logged in
- Check Firestore rules allow read/write access

### Registration not working

- Verify Firebase Authentication is enabled
- Check that Email/Password provider is enabled
- Look for errors in browser console

## Important Notes

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Security Rules**: The provided rules are basic - enhance them for production
3. **API Key**: Firebase API keys are safe to expose in client-side code as they're protected by security rules
4. **Billing**: Monitor your Firebase usage to stay within free tier limits

## Next Steps

After setting up Firebase:

1. Test registration and login thoroughly
2. Create subscription requests
3. Test role-based access (HOD, Finance, Admin)
4. Monitor Firestore usage in Firebase Console
5. Set up more detailed security rules for production

For more information, visit:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
