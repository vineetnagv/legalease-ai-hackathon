# Legalease AI

Legalease AI is a prototype application built with Next.js and Firebase that helps users understand complex legal documents. By uploading a contract and specifying their role, users can get an AI-powered analysis that includes a risk assessment, extraction of key numbers, and a breakdown of complex clauses into plain English.

This project was generated in Firebase Studio.

## Features

- **Secure Authentication**: Sign in with your Google account.
- **Document Upload**: Drag and drop text files for analysis.
- **AI-Powered Analysis**: Get a comprehensive breakdown of your legal document.
  - **Risk Meter**: A visual gauge of the document's risk level.
  - **Key Numbers**: Important figures and dates extracted for quick reference.
  - **Clause Explanations**: Complex legal clauses translated into simple, understandable language with a jargon-busting feature.

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 2. Set up Firebase

1.  Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2.  Go to **Project Settings** (click the gear icon ⚙️ next to "Project Overview").
3.  Under the **General** tab, scroll down to "Your apps".
4.  If you don't have a web app, create one by clicking the `</>` (Web) icon.
5.  Find your web app's Firebase configuration snippet. It will look like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIza...",
      authDomain: "your-project-id.firebaseapp.com",
      // ... and so on
    };
    ```
6.  In your project's code, create a new file named `.env` in the root directory.
7.  Copy and paste the following content into your new `.env` file, replacing the placeholder values with the actual keys from your Firebase config snippet:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
    ```
8. In your Firebase project, go to **Authentication** (from the left menu), select the **Sign-in method** tab, and enable the **Google** provider.

### 3. Install Dependencies

Navigate to the project directory and install the required packages:

```bash
npm install
```

### 4. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002). **You may need to restart the development server after updating the `.env` file for the changes to take effect.**

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
