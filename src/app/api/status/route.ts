import { NextResponse } from "next/server";
import { getAllDocs } from "@/lib/docsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: {
    backend: { ok: boolean; message: string };
    database: { ok: boolean; message: string };
    llm: { ok: boolean; message: string };
  } = {
    backend: { ok: true, message: "API route reachable" },
    database: { ok: false, message: "Not checked yet" },
    llm: { ok: false, message: "Not checked yet" },
  };

  // Database check: try to read documents store
  try {
    await getAllDocs();
    checks.database = { ok: true, message: "Docs store is readable" };
  } catch (error) {
    console.error("Status DB check failed", error);
    checks.database = { ok: false, message: "Failed to read docs store" };
  }

  // LLM check: verify configuration, but don't always make a paid call
  const apiKeyPresent = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKeyPresent) {
    checks.llm = {
      ok: false,
      message: "OPENAI_API_KEY is not set",
    };
  } else {
    checks.llm = {
      ok: true,
      message: `Client configured for model ${model}`,
    };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    checks,
  });
}

