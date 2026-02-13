## Private Knowledge Q&A – Mini Workspace

This is a small full‑stack web app (Next.js + TypeScript) for the **Private Knowledge Q&A** task.

You can:

- Add plain‑text documents to a private workspace.
- See a list of uploaded documents.
- Ask a question.
- Get an answer that uses your documents as context.
- See which document snippets were used to answer (document + passage).

There is also a **Status** page showing the health of:

- Backend API
- Document store (file‑based)
- LLM configuration (OpenAI env vars)

---

## How to run locally

### 1. Install dependencies

```bash
cd private-qa-app
npm install
```

### 2. Configure environment variables

Create a file called `.env.local` in the project root and add:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

> Do **not** commit `.env.local` to GitHub.

### 3. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## App walkthrough

- **Home page (`/`)**
  - Step 1: Add documents (title + text content).
  - Step 2: Ask a question.
  - Shows answer and the specific source snippets used.

- **Status page (`/status`)**
  - Shows backend availability.
  - Checks that the docs store is readable.
  - Shows whether the LLM client is configured (based on env vars).

The document store is a simple JSON file under a `data/` folder on disk, suitable for local/demo usage.

---

## Production / deployment

### Option A – Vercel (recommended for Next.js)

1. Push this folder to a GitHub repo.
2. In Vercel, import the repo as a new project.
3. Set environment variables in the Vercel dashboard:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional; default is `gpt-4.1-mini`)

> Note: Vercel’s runtime filesystem is not ideal for persistent file storage. For a long‑lived demo, prefer a host with a persistent volume or modify the app to use a database.

### Option B – Docker (one‑command run)

This repo includes a simple `Dockerfile`.

Build the image:

```bash
docker build -t private-qa-app .
```

Run the container (pass your OpenAI key at runtime):

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_openai_api_key_here \
  -e OPENAI_MODEL=gpt-4.1-mini \
  private-qa-app
```

Then open `http://localhost:3000`.

For persistent documents, you can mount a volume at `/app/data`:

```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_openai_api_key_here \
  -v ./data:/app/data \
  private-qa-app
```

---

## What is done vs not done

- **Done**
  - Document upload + listing.
  - Q&A endpoint using OpenAI (with basic snippet selection).
  - Answer + “where it came from” (document title + passage).
  - Status page (backend, docs store, LLM env).
  - Basic handling of empty questions / missing documents / missing API key / quota errors.
  - Dockerfile for production build.

- **Not done / possible extensions**
  - No authentication or multi‑user separation.
  - No database; docs are stored in a local JSON file.
  - No advanced retrieval (e.g., embeddings/vector search).
  - No tests.

