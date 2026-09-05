# Firestore Security Rules

To fix the registration permissions error and enforce the privacy constraints you requested, please open your **Firebase Console** (console.firebase.google.com), go to **Firestore Database** -> **Rules**, and replace the content with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function checking the admin role
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }

    match /members/{memberId} {
      // Allow any public visitor to submit a new registration application
      allow create: if true;
      
      // Admins have full access. Regular members can only read their OWN document (required for login and ID card).
      // Applicant data is strictly hidden from the public.
      allow read: if isAdmin() || (request.auth != null && request.auth.uid == memberId);
      
      // Only admins can approve or modify accounts
      allow update, delete: if isAdmin();
    }

    // Secure all other collections (e.g. news, donations) to admins, 
    // unless you add explicit public read rules for them later.
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```
