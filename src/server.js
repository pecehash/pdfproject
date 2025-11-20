import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { ensureMergedDir, mergeBuffersToFile } from "./services/mergeService.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 4000;

// serve static merged files
app.use("/merged", express.static(path.join(process.cwd(), "storage", "merged")));

app.get("/", (req, res) => {
  res.send("PDF Merger MVP - POST /v1/merge (multipart files[])");
});

app.post("/v1/merge", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 1) {
      return res.status(400).json({ error: "No files uploaded. Use field name 'files'." });
    }

    // Basic check: only accept PDFs
    for (const f of files) {
      if (!f.mimetype || !f.mimetype.includes("pdf")) {
        return res.status(400).json({ error: "All uploads must be PDFs." });
      }
    }

    await ensureMergedDir();

    const buffers = files.map((f) => f.buffer);
    const result = await mergeBuffersToFile(buffers);

    // public URL to download (local dev)
    const downloadUrl = `${req.protocol}://${req.get("host")}/merged/${result.filename}`;

    return res.json({
      status: "success",
      download_url: downloadUrl,
      pages: result.pages,
      size_bytes: result.size
    });
  } catch (err) {
    console.error("Merge error:", err);
    return res.status(500).json({ error: "merge_failed", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`PDF Merger MVP listening on http://localhost:${PORT}`);
});
