import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

const MERGED_DIR = path.join(process.cwd(), "storage", "merged");

export async function ensureMergedDir() {
  await fs.mkdir(MERGED_DIR, { recursive: true });
}

export async function mergeBuffersToFile(buffers) {
  const mergedPdf = await PDFDocument.create();

  for (const buf of buffers) {
    const pdf = await PDFDocument.load(buf);
    const copied = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copied.forEach((p) => mergedPdf.addPage(p));
  }

  const mergedBytes = await mergedPdf.save();
  const filename = `merged_${Date.now()}_${Math.random().toString(36).slice(2,9)}.pdf`;
  const outPath = path.join(MERGED_DIR, filename);

  await fs.writeFile(outPath, Buffer.from(mergedBytes));
  return { filename, outPath, size: mergedBytes.length, pages: mergedPdf.getPageCount() };
}
