# Legalease AI: Application Replication Guide

This document provides a comprehensive guide to understanding, recreating, and extending the Legalease AI application. It details the project structure, technology stack, Firebase integration, and a complete breakdown of all AI functionalities.

## 1. Core Application & Technology Stack

Legalease AI is a web application designed to help users understand complex legal documents. It's built on a modern, robust, and scalable technology stack.

-   **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Library**: [React](https://react.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components for a professional and consistent look and feel.
-   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) (Google Sign-In and Email/Password).
-   **AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit) for all generative AI features.

## 2. Firebase Project Setup

Firebase is used for user authentication. Follow these steps to set up a new Firebase project.

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Create a Web App**: Inside your project, add a new Web Application (`</>`).
3.  **Get Config Keys**: After creating the web app, Firebase will provide you with a `firebaseConfig` object. You will need these keys for your environment variables.
4.  **Create `.env` file**: In the root of your project, create a file named `.env` and populate it with the keys from your `firebaseConfig` object:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

5.  **Enable Auth Providers**:
    -   In the Firebase Console, go to **Authentication**.
    -   Under the **Sign-in method** tab, enable both **Google** and **Email/Password** as providers.
6.  **Add Gemini API Key**:
    -   Go to [Google AI Studio](httpss://aistudio.google.com/app/apikey) to generate a Gemini API Key.
    -   Add this key to your `.env` file:
    ```env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

## 3. Project Structure Overview

The codebase is organized into logical directories to separate concerns.

-   `src/app/`: Contains the core Next.js pages, routes, and server-side actions (`actions.ts`).
-   `src/components/`: Home to all React components, including UI elements from shadcn and custom application components like `Dashboard.tsx` and `LoginPage.tsx`.
-   `src/ai/`: The heart of the AI functionality.
    -   `genkit.ts`: Central configuration for Genkit and the Google AI plugin.
    -   `flows/`: Contains individual files for each distinct AI task (e.g., `suggest-user-role.ts`, `assess-document-risk.ts`).
-   `src/lib/`: Contains shared utilities, context providers, and type definitions.
    -   `firebase/`: Configuration and context for Firebase services.
    -   `ai-types.ts`: Centralized Zod schemas and TypeScript types for all AI flow inputs and outputs.
    -   `translations.ts`: Holds all internationalization strings.

## 4. Step-by-Step AI Functionality Breakdown

This section details each AI feature that was previously implemented. All AI logic is handled through Genkit flows, which are server-side functions that call the Gemini large language model.

### Central AI Configuration (`src/ai/genkit.ts`)

This is the entry point for all AI functionality. It initializes Genkit with the Google AI plugin and sets a global default model to ensure consistency and prevent "model not found" errors.

-   **Model**: `googleai/gemini-2.5-flash`
-   **Authentication**: The plugin automatically uses the `GEMINI_API_KEY` from the `.env` file.

### Centralized Type Definitions (`src/lib/ai-types.ts`)

To ensure type safety and avoid Next.js build errors with `'use server'`, all AI-related data structures (inputs and outputs) are defined using Zod schemas in this single file. This file does **not** have a `'use server'` directive. Each flow then imports its required types from here.

### AI Flow 1: Suggest User Role (`src/ai/flows/suggest-user-role.ts`)

-   **Purpose**: The first and simplest AI task. It analyzes the raw document text to infer the user's most likely role in the agreement.
-   **Input**: `string` (the full text of the legal document).
-   **Output**: `string` (a single, concise role name, e.g., "Tenant").
-   **Logic**: A prompt instructs the AI to act as a legal analyst, read the document, and identify one of the primary parties.

### AI Flow 2: Assess Document Risk (`src/ai/flows/assess-document-risk.ts`)

-   **Purpose**: To provide an overall risk assessment for the user based on their specified role.
-   **Input**: `AssessDocumentRiskInput` object containing `documentText: string` and `userRole: string`.
-   **Output**: `AssessDocumentRiskOutput` object containing `riskScore: number` (0-100) and `riskSummary: string`.
-   **Logic**: The prompt asks the AI to evaluate the document from the perspective of the `userRole`. It considers potential pitfalls, unfavorable clauses, and imbalances, then synthesizes this into a numerical score and a brief, easy-to-understand summary of its findings.

### AI Flow 3: Extract Key Numbers (`src/ai/flows/extract-key-numbers.ts`)

-   **Purpose**: To quickly pull out important numerical data, dates, and other key values for easy reference.
-   **Input**: `string` (the full document text).
-   **Output**: `ExtractKeyNumbersOutput` object, which is an array of objects, each with a `label: string` and `value: string`.
-   **Logic**: The AI is prompted to scan the document for quantifiable data points like rent amounts, security deposits, contract start/end dates, notice periods, and other significant numbers. It formats these into a structured list.

### AI Flow 4: Explain Clauses (`src/ai/flows/explain-clauses.ts`)

-   **Purpose**: To translate complex legal clauses into plain, understandable English.
-   **Input**: `ExplainClausesInput` object containing `documentText: string` and `userRole: string`.
-   **Output**: `ExplainClausesOutput` object, an array of `ClauseExplanation` objects. Each contains:
    -   `clauseTitle: string`
    -   `originalText: string`
    -   `plainEnglish: string`
    -   `jargon: { term: string; definition: string }[]` (A "Jargon Buster" feature).
-   **Logic**: The AI segments the document into major clauses. For each clause, it generates a simplified explanation from the user's perspective and identifies any legal jargon, providing a definition for each term.

### AI Flow 5: Generate FAQs (`src/ai/flows/generate-faq.ts`)

-   **Purpose**: To proactively answer common questions and "what if" scenarios based on the document's content.
-   **Input**: `GenerateFaqInput` object with `documentText: string` and `userRole: string`.
-   **Output**: `GenerateFaqOutput` object, an array of `{ question: string; answer: string }` objects.
-   **Logic**: The prompt instructs the AI to imagine it is advising the `userRole` and to generate a list of likely questions they might have about the agreement, along with clear, concise answers based on the document's text.

### AI Flow 6: Detect Missing Clauses (`src/ai/flows/detect-missing-clauses.ts`)

-   **Purpose**: To identify potentially critical clauses that are commonly found in similar documents but are absent from the uploaded one.
-   **Input**: `DetectMissingClausesInput` object with `documentText: string`, `userRole: string`, and `documentType: string` (e.g., "Lease Agreement").
-   **Output**: `DetectMissingClausesOutput` object, an array of `MissingClause` objects, each with:
    -   `clauseName: string`
    -   `description: string`
    -   `riskOfAbsence: string`
-   **Logic**: The AI is prompted to act as a diligent legal expert. Based on the document type, it cross-references a mental checklist of standard clauses. If a common clause is missing, it flags it and explains the potential risk to the user.

### UI and Integration (`actions.ts` and `Dashboard.tsx`)

-   **`src/app/actions.ts`**: This file acts as the bridge between the client-side components and the server-side AI flows. It contains async wrapper functions that import and call each Genkit flow.
-   **`src/components/dashboard.tsx`**: This component manages the application's state (`idle`, `analyzing`, `success`, `error`). It calls the server actions in a specific sequence to create a step-by-step loading experience for the user (e.g., "Analyzing risk...", "Extracting key numbers..."). Upon success, it passes the structured AI data down to the various display components (`RiskMeter`, `ClauseBreakdown`, etc.).

This guide provides the complete blueprint to restore the application to its full-featured state.