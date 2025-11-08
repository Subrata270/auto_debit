'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);

  return {
    firebaseApp: app,
    auth: auth,
    firestore: getFirestore(app)
  };
}

export function getSdks(FirebaseApp: FirebaseApp) {
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
export * from './errors';
export * from './error-emitter';
