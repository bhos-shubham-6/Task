## AI_NOTES

- **Tools used**: Cursor + ChatGPT-style agents to scaffold the Next.js app, design the API routes (`/api/docs`, `/api/ask`, `/api/status`), and build the main UI layout.
- **What I personally checked**:
  - Verified document upload, listing, and Q&A flow locally.
  - Confirmed that status page reports backend + docs store + LLM config.
  - Ensured OpenAI API key is only read from environment variables (not committed).
- **LLM provider**: OpenAI, using a GPT‑4.1‑class chat model (configurable via `OPENAI_MODEL`, default `gpt-4.1-mini`) because:
  - It has good reasoning and instruction-following.
  - The official `openai` Node SDK integrates cleanly with Next.js API routes.

