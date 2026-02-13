import fs from "fs";
import path from "path";

export type DocRecord = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type DocsFile = {
  docs: DocRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_PATH = path.join(DATA_DIR, "docs.json");

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCS_PATH)) {
    const initial: DocsFile = { docs: [] };
    fs.writeFileSync(DOCS_PATH, JSON.stringify(initial, null, 2), "utf-8");
  }
}

function readDocsFile(): DocsFile {
  ensureDataFile();
  const raw = fs.readFileSync(DOCS_PATH, "utf-8");
  try {
    const parsed = JSON.parse(raw) as DocsFile;
    if (!Array.isArray(parsed.docs)) {
      return { docs: [] };
    }
    return parsed;
  } catch {
    return { docs: [] };
  }
}

function writeDocsFile(data: DocsFile): void {
  ensureDataFile();
  fs.writeFileSync(DOCS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function getAllDocs(): Promise<DocRecord[]> {
  const data = readDocsFile();
  // Return newest first
  return data.docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addDoc(input: {
  title: string;
  content: string;
}): Promise<DocRecord> {
  const now = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const data = readDocsFile();
  const record: DocRecord = {
    id,
    title: input.title.trim() || "Untitled document",
    content: input.content,
    createdAt: now,
  };

  data.docs.push(record);
  writeDocsFile(data);
  return record;
}

