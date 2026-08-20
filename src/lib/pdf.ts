"use server";

import { extractText } from "unpdf";
import { requireUser } from "@/lib/auth";

export type PdfExtractResult =
  | { text: string; suggestedName: string }
  | { error: string };

export async function extractPdfText(formData: FormData): Promise<PdfExtractResult> {
  await requireUser();
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Keine PDF-Datei ausgewählt." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Die PDF ist größer als 10 MB." };
  }
  const name = file.name.toLowerCase();
  if (file.type && !file.type.includes("pdf") && !name.endsWith(".pdf")) {
    return { error: "Bitte eine PDF-Datei wählen." };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extracted = await extractText(bytes, { mergePages: true });
    const raw = Array.isArray(extracted.text) ? extracted.text.join("\n") : String(extracted.text ?? "");
    const text = raw
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!text) {
      return { error: "In der PDF wurde kein Text gefunden (evtl. nur Bilder)." };
    }
    const suggestedName = file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
    return { text, suggestedName };
  } catch {
    return { error: "Die PDF konnte nicht gelesen werden." };
  }
}
