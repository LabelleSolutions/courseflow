# Firebase Integration Guide

This document explains how to connect CourseFlow to your Firebase project (Auth, Firestore, Storage).

---

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the wizard.
3. Once the project is created, click **Continue**.

---

## 2. Register a Web App

1. In your Firebase project, click the **Web** icon (`</>`).
2. Register the app (give it a nickname, e.g. `courseflow-web`).
3. Firebase will show you a `firebaseConfig` object — you will need those values next.

---

## 3. Set Environment Variables Locally

1. Copy `.env.example` to `.env.local` in the project root:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in the values from the `firebaseConfig` object:

   | Variable | Firebase Config field |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

3. **Never commit `.env.local`** — it is already listed in `.gitignore`.

---

## 4. Enable Authentication Providers

In the Firebase Console → **Authentication** → **Sign-in method**:

- Enable **Google** (requires an OAuth consent screen — Firebase guides you through it).
- Enable **Email/Password** for traditional sign-in.

---

## 5. Set Up Firestore

1. Firebase Console → **Firestore Database** → **Create database**.
2. Start in **test mode** for local development, then tighten rules before going to production.

Example production rules (restrict reads/writes to authenticated users):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 6. Set Up Storage

1. Firebase Console → **Storage** → **Get started**.
2. Start in **test mode** for local development.

Example production rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 7. Using the Firebase Helpers in Code

The Firebase client is initialised once in `src/lib/firebase/client.ts`. Import from there:

```typescript
import { auth, db, storage, signInWithGoogle } from "../lib/firebase/client";
```

### Google Sign-In

```typescript
import { signInWithGoogle } from "../lib/firebase/client";

async function handleLogin() {
  const result = await signInWithGoogle();
  console.log("Signed in as", result.user.displayName);
}
```

### Email / Password Sign-In

```typescript
import { auth } from "../lib/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";

await signInWithEmailAndPassword(auth, email, password);
```

### Firestore Read / Write

```typescript
import { db } from "../lib/firebase/client";
import { collection, addDoc, getDocs } from "firebase/firestore";

// Write
await addDoc(collection(db, "courses"), { title: "My Course" });

// Read
const snapshot = await getDocs(collection(db, "courses"));
snapshot.forEach((doc) => console.log(doc.id, doc.data()));
```

### Storage Upload

```typescript
import { storage } from "../lib/firebase/client";
import { ref, uploadBytes } from "firebase/storage";

const storageRef = ref(storage, "uploads/my-file.pdf");
await uploadBytes(storageRef, file);
```

---

## 8. Deployment Environment Variables

When deploying (e.g. Vercel, Firebase Hosting, or any CI/CD platform), set the same `VITE_FIREBASE_*` environment variables in your hosting dashboard — **never** hard-code them in source files.
