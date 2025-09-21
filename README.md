# 🏛️ LegalEase AI

**AI-Powered Legal Document Analysis Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🏆 **Google Cloud Gen AI Exchange Hackathon Submission**: Transform complex legal documents into clear, actionable insights using AI

LegalEase AI is an intelligent document analysis platform that helps users understand complex legal documents through AI-powered analysis. Whether you're a business owner reviewing contracts or an individual navigating legal documents, LegalEase provides comprehensive insights in plain English.

## ✨ Features

### 🔍 **Intelligent Document Analysis**
- **Multi-format Support**: Upload `.pdf`, `.docx`, or `.txt` files
- **Smart Document Detection**: Automatically identifies document types (contracts, leases, etc.)
- **Role-Based Analysis**: Tailored insights based on your role (tenant, business owner, etc.)

### 🎯 **Core Analysis Features**
- **📊 Risk Assessment**: Visual risk meter with detailed explanations
- **📅 Key Numbers Extraction**: Important dates, amounts, and deadlines
- **📝 Plain English Explanations**: Complex legal clauses broken down simply
- **❓ FAQ Generation**: Common questions answered for your specific role
- **⚠️ Missing Clause Detection**: Identifies important protections you might be missing

### 🚀 **Advanced Capabilities**
- **🎙️ Voice Input**: Speak your questions naturally
- **💬 Interactive Chat**: Ask follow-up questions about your document
- **📄 Document Comparison**: Compare multiple documents side-by-side
- **📋 Export Options**: Download analysis as PDF or copy to clipboard
- **🌙 Dark Mode**: Full dark/light theme support

### 🔒 **Security & Privacy**
- **Secure Authentication**: Google OAuth integration
- **Private Processing**: Documents processed securely and not stored permanently
- **User Preferences**: Customizable interface and settings

## 🎥 Demo

*[Add screenshots or demo video here]*

**Key Workflows:**
1. **Upload** → Drag & drop your legal document
2. **Analyze** → AI processes and extracts insights
3. **Understand** → Review risk levels, key terms, and explanations
4. **Chat** → Ask questions about specific clauses
5. **Export** → Save or share your analysis

## 🛠️ Technology Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Framework**: [React 18](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **AI Services**: [Google Gemini](https://ai.google.dev/) + [Vertex AI](https://cloud.google.com/vertex-ai)
- **Document Processing**: [pdf-parse](https://www.npmjs.com/package/pdf-parse), [mammoth](https://www.npmjs.com/package/mammoth)
- **Voice Input**: Web Speech API
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Firebase project with Authentication enabled
- Google AI API keys (Gemini/Vertex AI)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/legalease-ai.git
cd legalease-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Configure Firebase:
   - Create a [Firebase project](https://console.firebase.google.com/)
   - Enable **Authentication** with Google provider
   - Copy your Firebase config values to `.env.local`

3. Configure AI Services:
   - Get a [Google AI API key](https://ai.google.dev/) for Gemini
   - Set up [Vertex AI](https://cloud.google.com/vertex-ai) for advanced features
   - Add your API keys to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) to see the application.

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── parse-document # Document processing endpoint
│   └── actions.ts         # Server actions
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── panels/           # Feature panels (chat, settings, etc.)
│   └── chat-interface.tsx # Main chat interface
├── hooks/                 # Custom React hooks
│   └── use-simple-voice-input.ts # Voice input logic
├── lib/                   # Utility libraries
│   ├── firebase/         # Firebase configuration
│   ├── export-utils.ts   # Document export utilities
│   └── chat-storage.ts   # Chat persistence
├── ai/                    # AI processing flows
│   └── flows/            # Individual analysis workflows
└── types/                 # TypeScript type definitions
```

## 🔧 Configuration

### Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Google provider

2. **Get Configuration**:
   ```javascript
   // Found in Project Settings > General > Your apps
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

### AI Services Setup

1. **Google AI (Gemini)**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create an API key
   - Add to `GEMINI_API_KEY` in your environment

2. **Vertex AI** (Optional - for advanced features):
   - Enable Vertex AI in Google Cloud Console
   - Create service account credentials
   - Add API keys to environment variables

## 📝 Usage Examples

### Basic Document Analysis
```javascript
// Upload document → Automatic analysis
// Results include: risk score, key numbers, clause explanations
```

### Voice Interaction
```javascript
// Click microphone → Speak question → Get AI response
// Example: "What are the termination conditions in this lease?"
```

### Document Comparison
```javascript
// Upload second document → Compare clauses and terms
// Identify differences and missing protections
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Information

**Project Category**: Legal Tech / AI Innovation
**Development Time**: [Your timeframe]
**Team Size**: [Your team size]

### Key Achievements
- ✅ Full-stack document analysis platform
- ✅ Multi-modal AI integration (text + voice)
- ✅ Real-time document processing
- ✅ Responsive, accessible UI
- ✅ Production-ready deployment

### Challenges Overcome
- Complex PDF text extraction and OCR processing
- Voice input reliability and user experience
- Real-time AI streaming and progress indicators
- Document comparison algorithms
- Mobile-responsive legal document interface

## 🔗 Links

- **Live Demo**: [Add your deployment URL]
- **Documentation**: [HACKATHON.md](HACKATHON.md)
- **API Documentation**: [API Reference](docs/api.md)

## 📞 Support

For questions or support:
- Open an [issue](https://github.com/your-username/legalease-ai/issues)
- Contact: [your-email@example.com]

---

**Built with ❤️ for making legal documents accessible to everyone**