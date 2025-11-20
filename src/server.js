import 'dotenv/config';
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { ensureMergedDir, mergeBuffersToFile } from "./services/mergeService.js";
import { saveJob, getHistory } from "./services/db.js";
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

app.get("/v1/history", async (req, res) => {
  try {
    const jobs = await getHistory(10); // ultimele 10 merge-uri
    // Adaugă download URL
    const jobsWithUrl = jobs.map(job => ({
      ...job,
      download_url: `${req.protocol}://${req.get("host")}/merged/${job.filename}`
    }));
    res.json(jobsWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_fetch_history" });
  }
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

    // Salvează în DB
    await saveJob({
    filename: result.filename,
    pages: result.pages,
    size_bytes: result.size
    });

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
