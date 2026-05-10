# Ethical Decision Simulator

Minimal ethical dilemma quiz (10 questions) with AI-based analysis.

## Demo

A short walkthrough of the app — start screen, quiz flow, and the AI-generated reading.

<video src="./screen-recording/prompt-engineering-dilemma.mp4" controls width="100%">
  Your browser does not support inline video.
  <a href="./screen-recording/prompt-engineering-dilemma.mp4">Download the demo (~16 MB)</a>.
</video>

> If the video does not play inline, open [`screen-recording/prompt-engineering-dilemma.mp4`](./screen-recording/prompt-engineering-dilemma.mp4) directly.

## Prerequisites
- Node.js 18+
- An OpenAI API key

## 1) Install everything

From the project root:

```powershell
npm run install:all
```

This installs the root tooling (`concurrently`) plus both `backend/` and `frontend/` dependencies.

## 2) Configure the backend

```powershell
cd backend
copy .env.example .env
notepad .env   # set OPENAI_API_KEY
cd ..
```

## 3) Run both servers with one command

From the project root:

```powershell
npm run dev
```

This starts the Express backend on `http://localhost:3001` and the Vite/React frontend on `http://localhost:5173` in the same terminal, with prefixed output (`[backend]` / `[frontend]`). `Ctrl+C` stops both; if either crashes, the other is killed too (`--kill-others-on-fail`).

### Run them separately

```powershell
npm run dev:backend     # Express only
npm run dev:frontend    # Vite only
```

The frontend talks to the backend via a dev proxy:
- `GET /api/dilemmas`
- `POST /api/analyze`

## Project structure
- `backend/server.js`
- `backend/data/dilemmas.json`
- `frontend/src/App.jsx`
- `frontend/src/Quiz.jsx`
- `frontend/src/Result.jsx`
- `frontend/src/index.css`
