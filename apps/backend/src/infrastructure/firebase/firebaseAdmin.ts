import { App, applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Environment } from "../config/environment.js";

let firebaseApp: App | undefined;
let firebaseAuth: Auth | undefined;

const getFirebaseApp = (): App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const environment = Environment.getInstance();
  const firebaseAppOptions =
    environment.firebaseProjectId === undefined
      ? { credential: applicationDefault() }
      : {
          credential: applicationDefault(),
          projectId: environment.firebaseProjectId,
        };

  firebaseApp = getApps()[0] ?? initializeApp(firebaseAppOptions);
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }

  return firebaseAuth;
};
