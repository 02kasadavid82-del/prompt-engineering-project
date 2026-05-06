# Ethical Decision Simulator (MVP)

Minimal ethical dilemma quiz (10 questions) with AI-based analysis.

## Prerequisites
- Node.js 18+ (you have Node installed already)
- An OpenAI API key

## 1) Run the backend (Express)

In one terminal:

```powershell
cd c:\Users\Upgradepc\Coding\david\prompt-engineering-project\backend
npm install
copy .env.example .env
notepad .env
npm run dev
```

Set `OPENAI_API_KEY` inside `.env`.

Backend runs on `http://localhost:3001`.

## 2) Run the frontend (Vite + React)

In a second terminal:

```powershell
cd c:\Users\Upgradepc\Coding\david\prompt-engineering-project\frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

The frontend calls the backend via a dev proxy:
- `GET /api/dilemmas`
- `POST /api/analyze`

## Project structure
- `backend/server.js`
- `backend/data/dilemmas.json`
- `frontend/src/App.jsx`
- `frontend/src/Quiz.jsx`
- `frontend/src/Result.jsx`
- `frontend/src/index.css`
