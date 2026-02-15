# re-say!: Pronunciation Assessment App

re-say! is English pronunciation assessment web application using Azure Speech Service.

## Features

- Record your voice directly in the browser
- Convert audio to WAV format (PCM 16kHz mono)
- Get detailed pronunciation assessment from Azure Speech Service
- View scores for accuracy, fluency, completeness, and prosody
- Word-by-word analysis with error detection

## Tech Stack

- **Frontend**:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui
- **Backend**:
  - Express
  - TypeScript
- **API**:
  - Azure Speech Service Pronunciation Assessment

## Prerequisites

- Node.js 18 or higher
- Azure Speech Service subscription

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd re-say
```

### 2. Configure environment variables

Copy the example environment file and fill in your Azure credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Azure Speech Service credentials:

```env
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=japaneast
PORT=3000
```

### 3. Install dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/frontend
npm install
cd ../..

# Install backend dependencies
cd apps/backend
npm install
cd ../..
```

## Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

This will start:

- Frontend dev server on http://localhost:5173
- Backend server on http://localhost:3000

## Usage

1. Open the application in your browser
2. You'll see a practice text displayed (e.g., "Good morning.")
3. Click the "🎤 Speak" button to start recording
4. Read the text aloud
5. Click the "⏹ Stop" button to finish recording
6. Wait for the analysis (usually 2-5 seconds)
7. View your pronunciation scores and word-by-word feedback

## Project Structure

```
re-say/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── lib/
│   │   └── package.json
│   └── backend/
│       ├── src/
│       │   ├── presentation/
│       │   ├── application/
│       │   ├── domain/
│       │   └── infrastructure/
│       └── package.json
├── packages/
│   └── shared/
│       └── types/
└── package.json          # Root package.json
```
