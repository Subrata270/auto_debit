'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  // This line is critical for fixing the auth/invalid-continue-uri error in this specific environment.
  auth.tenantId = firebaseConfig.authDomain;

  return {
    firebaseApp: app,
    auth: auth,
    firestore: getFirestore(app)
  };
}

export function getSdks(FirebaseApp) {
  return {
    firebaseApp: FirebaseApp,
    auth: getAuth(FirebaseApp),
    firestore: getFirestore(FirebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';