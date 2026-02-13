import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAllDocs, type DocRecord } from "@/lib/docsStore";

export const dynamic = "force-dynamic";

type SourceSnippet = {
  docId: string;
  docTitle: string;
  snippet: string;
};

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "is",
  "are",
  "was",
  "were",
  "it",
  "this",
  "that",
  "as",
  "from",
  "be",
  "about",
  "into",
  "over",
  "after",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t && !STOP_WORDS.has(t));
}

function scoreSnippet(questionTokens: string[], snippet: string): number {
  const snippetTokens = tokenize(snippet);
  if (!snippetTokens.length) return 0;

  const snippetSet = new Set(snippetTokens);
  let overlap = 0;
  for (const token of questionTokens) {
    if (snippetSet.has(token)) overlap += 1;
  }
  return overlap;
}

function splitIntoSnippets(content: string): string[] {
  const paragraphs = content.split(/\n\s*\n/g).map((p) => p.trim());
  const snippets: string[] = [];

  for (const p of paragraphs) {
    if (!p) continue;
    if (p.length <= 600) {
      snippets.push(p);
    } else {
      // Hard wrap long paragraphs
      for (let i = 0; i < p.length; i += 600) {
        snippets.push(p.slice(i, i + 600));
      }
    }
  }

  return snippets;
}

function selectTopSnippets(
  question: string,
  docs: DocRecord[],
  limit = 3,
): SourceSnippet[] {
  const questionTokens = tokenize(question);
  if (!questionTokens.length) return [];

  type Scored = SourceSnippet & { score: number };
  const scored: Scored[] = [];

  for (const doc of docs) {
    const snippets = splitIntoSnippets(doc.content);
    for (const snippet of snippets) {
      const score = scoreSnippet(questionTokens, snippet);
      if (score > 0) {
        scored.push({
          score,
          docId: doc.id,
          docTitle: doc.title,
          snippet,
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);
  return top.map(({ docId, docTitle, snippet }) => ({
    docId,
    docTitle,
    snippet,
  }));
}

export async function POST(req: NextRequest) {
  // We keep sources in outer scope so we can reuse them in error handling if needed.
  let sources: SourceSnippet[] = [];

  try {
    const body = await req.json();
    const question = (body?.question ?? "").toString().trim();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }

    const docs = await getAllDocs();
    if (!docs.length) {
      return NextResponse.json(
        { error: "No documents available. Please add a document first." },
        { status: 400 },
      );
    }

    sources = selectTopSnippets(question, docs);
    if (!sources.length) {
      return NextResponse.json(
        {
          answer:
            "I could not find any part of your documents that clearly answers this question.",
          sources: [],
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const contextText = sources
      .map(
        (s, index) =>
          `Source ${index + 1} — ${s.docTitle}:\n${s.snippet.trim()}`,
      )
      .join("\n\n");

    let answer: string;

    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that answers questions using ONLY the provided private documents. " +
              "If the answer is not clearly present in the documents, say that you don't know.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Here are snippets from the user's private documents:\n\n${contextText}\n\n` +
                  `Question: ${question}\n\n` +
                  "Answer the question as clearly and concisely as possible.",
              },
            ],
          },
        ],
        temperature: 0.2,
      });

      answer =
        completion.choices[0]?.message?.content ??
        "I could not generate an answer from the model.";
    } catch (err: any) {
      // Handle quota / rate limit gracefully: fall back to showing the best snippet.
      const message = String(err?.message ?? "").toLowerCase();
      const isQuotaError =
        err?.status === 429 ||
        err?.code === "insufficient_quota" ||
        err?.error?.type === "insufficient_quota" ||
        message.includes("insufficient_quota") ||
        message.includes("you exceeded your current quota");

      if (isQuotaError) {
        console.warn("OpenAI quota error, falling back to snippet-only answer");
        answer =
          sources[0]?.snippet ??
          "I could not call the language model because the account has insufficient quota. " +
            "Here is the most relevant passage from your documents instead.";
      } else {
        // Re-throw unexpected errors so they are handled by the outer catch.
        throw err;
      }
    }

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error) {
    console.error("Error answering question", error);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 },
    );
  }
}

