console.log("DATABASE_URL:", process.env.DATABASE_URL);

import 'dotenv/config';
import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { ensureMergedDir, mergeBuffersToFile } from "./services/mergeService.js";
import { saveJob, getHistoryForUser } from "./services/db.js";
import { createUser, findUserByEmail } from "./services/users.js";
import { generateToken } from "./auth.js";
import bcrypt from "bcrypt";
import { findUserByApiKey } from "./services/users.js";
import { authMiddleware } from "./auth.js";
import { useRouter } from "next/navigation";
import fs from "fs";




export async function apiKeyMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key) return res.status(401).json({ error: "missing_api_key" });

  const user = await findUserByApiKey(key);
  if (!user) return res.status(403).json({ error: "invalid_api_key" });

  req.user = user;
  next();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 4000;

// serve static merged files
app.use("/merged", express.static(path.join(process.cwd(), "storage", "merged")));

app.get("/", (req, res) => {
  res.send("PDF Merger MVP - POST /v1/merge (multipart files[])");
});

app.get("/v1/history", authMiddleware, async (req, res) => {
  const jobs = await getHistoryForUser(req.user.id);
  res.json(jobs);
});

app.post("/v1/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  const existing = await findUserByEmail(email);
  if (existing) return res.status(400).json({ error: "email_exists" });

  const user = await createUser(email, password);
  const token = generateToken(user);

  res.json({ user, token });
});


const router = useRouter();

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("api_key");
  router.push("/login");
}


app.post("/v1/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: "invalid_credentials" });

  const token = generateToken(user);

  res.json({ user: { id: user.id, email: user.email, api_key: user.api_key }, token });
});

app.post("/v1/merge", apiKeyMiddleware, upload.array("files", 10), async (req, res) => {
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
    user_id: req.user.id,
    filename: result.filename,
    pages: result.pages,
    size_bytes: result.size
  });

    // public URL to download (local dev)
    const downloadUrl = `${req.protocol}://${req.get("host")}/merged/${result.filename}`;

  app.get("/merged/:filename", (req, res) => {
  const filePath = path.join(process.cwd(), "storage", "merged", req.params.filename);
  res.download(filePath); // forces browser to download
});

    

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
