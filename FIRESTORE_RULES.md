# Firestore Security Rules

To fix the `permission-denied` errors, you need to update your Firestore security rules. Because the app currently does not use Firebase Authentication (it uses a client-side admin password for the prototype), the previous rules that checked for authentication were blocking all access.

Please open your **Firebase Console** (console.firebase.google.com), go to **Firestore Database** -> **Rules**, and replace the content with the following to allow the app to read and write its data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to the zwanan collection used by the app
    match /zwanan/{document=**} {
      allow read, write: if true;
    }
    // Default catch-all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

*Note: Setting `allow read, write: if true;` is useful for prototyping but makes the database publicly accessible. For a production app, we should integrate real Firebase Authentication.*
