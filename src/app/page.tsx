 "use client";

import { FormEvent, useEffect, useState } from "react";

type Doc = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type SourceSnippet = {
  docId: string;
  docTitle: string;
  snippet: string;
};

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  useEffect(() => {
    void loadDocs();
  }, []);

  async function loadDocs() {
    try {
      setDocsLoading(true);
      setDocsError(null);
      const res = await fetch("/api/docs");
      if (!res.ok) {
        throw new Error(`Failed to load docs: ${res.status}`);
      }
      const data = await res.json();
      setDocs(data.docs ?? []);
    } catch (error) {
      console.error(error);
      setDocsError("Could not load documents from the server.");
    } finally {
      setDocsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:py-14">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Private Knowledge Q&A
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Your mini workspace: add a few private documents, then ask
              questions and see exactly which passages were used to answer.
            </p>
          </div>
          <a
            href="/status"
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            View Status
          </a>
        </header>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              1. Add documents
            </h2>
            <p className="text-xs text-zinc-500">
              Paste in text from notes, specs, or docs. Plain text is enough.
            </p>
            <DocumentForm onSaved={loadDocs} />
            <DocumentList
              docs={docs}
              loading={docsLoading}
              error={docsError}
            />
          </div>

          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              2. Ask a question
            </h2>
            <p className="text-xs text-zinc-500">
              The app searches your documents and shows which passages were
              most relevant to the answer.
            </p>
            <QuestionPanel />
          </div>
        </section>
      </main>
    </div>
  );
}

function DocumentForm(props: { onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get("title") ?? "").toString().trim();
    const content = (formData.get("content") ?? "").toString().trim();

    if (!content) {
      setError("Please paste some content for the document.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save document.");
      }
      form.reset();
      props.onSaved();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong saving.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-600">
          Title
        </label>
        <input
          type="text"
          name="title"
          placeholder="E.g. Project notes"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none ring-0 focus:border-zinc-400"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-600">
          Content
        </label>
        <textarea
          name="content"
          rows={6}
          placeholder="Paste your text document here..."
          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none ring-0 focus:border-zinc-400"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {saving ? "Saving..." : "Save document"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

function DocumentList(props: {
  docs: Doc[];
  loading: boolean;
  error: string | null;
}) {
  if (props.loading && !props.docs.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
        Loading documents...
      </div>
    );
  }

  if (props.error) {
    return (
      <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
        {props.error}
      </div>
    );
  }

  if (!props.docs.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
        No documents yet. Add one above to get started.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        Recently added
      </p>
      <ul className="space-y-1.5 text-xs">
        {props.docs.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-800">
                {doc.title || "Untitled document"}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                {doc.content.slice(0, 120) || "Empty document"}
              </p>
            </div>
            <span className="ml-3 shrink-0 text-[10px] font-mono text-zinc-500">
              {new Date(doc.createdAt).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceSnippet[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed) {
      setError("Please type a question first.");
      return;
    }

    try {
      setAsking(true);
      setError(null);
      setAnswer(null);
      setSources([]);

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to get an answer.");
      }

      setAnswer(data.answer ?? null);
      setSources(data.sources ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong asking.",
      );
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <textarea
        rows={4}
        placeholder="Ask a question about your documents..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none ring-0 focus:border-zinc-400"
      />
      <button
        type="button"
        onClick={handleAsk}
        disabled={asking}
        className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {asking ? "Asking..." : "Ask"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {answer ? (
        <div className="mt-2 space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Answer
            </p>
            <p className="whitespace-pre-wrap text-zinc-800">{answer}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Sources used
            </p>
            {sources.length === 0 ? (
              <p className="text-[11px] text-zinc-500">
                No specific passages were identified for this answer.
              </p>
            ) : (
              <ul className="space-y-2">
                {sources.map((s, index) => (
                  <li
                    key={`${s.docId}-${index}`}
                    className="rounded-md border border-zinc-200 bg-white p-2"
                  >
                    <p className="text-[11px] font-medium text-zinc-700">
                      {s.docTitle || "Untitled document"}
                    </p>
                    <pre className="mt-1 max-h-32 overflow-auto rounded bg-zinc-50 p-2 text-[11px] text-zinc-600">
                      {s.snippet}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
          Answers and highlighted sources will appear here after you ask a
          question.
        </div>
      )}
    </div>
  );
}

