import { NextRequest, NextResponse } from "next/server";
import { addDoc, getAllDocs } from "@/lib/docsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docs = await getAllDocs();
    return NextResponse.json({ docs });
  } catch (error) {
    console.error("Error loading docs", error);
    return NextResponse.json(
      { error: "Failed to load documents" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = (body?.title ?? "").toString();
    const content = (body?.content ?? "").toString();

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    const created = await addDoc({ title, content });
    return NextResponse.json({ doc: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating doc", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}

