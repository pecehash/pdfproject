"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [status, setStatus] = useState("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const api_key = typeof window !== "undefined" ? localStorage.getItem("api_key") : "";

    useEffect(() => {
        // Redirect if not authenticated
        if (!token) {
        router.replace("/login"); // use replace so back button can't return
        }
    }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("api_key");
    router.push("/login"); // ✅ Works in App Router
  }

 const handleUpload = async () => {
   if (!files.length) return;
   const formData = new FormData();
   files.forEach(f => formData.append("files", f));
 
   setStatus("Uploading…");
   try {
     const res = await api.post("/merge", formData, {
       headers: { "x-api-key": api_key },
     });
     setStatus(`Merged successfully! Download: ${res.data.download_url}`);
     fetchHistory();
   } catch (err) {
     setStatus("Upload failed.");
     console.error(err);
   }
 };

   // 🔥 ADD LOGOUT FUNCTION HERE
 
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Logout button */}
      <button onClick={logout}>Logout</button>

      <input type="file" multiple onChange={e => {
  if (!e.target.files) return;           // 👈 avoid null
  setFiles(Array.from(e.target.files));  // 👈 convert FileList → File[]
}} />
      <button onClick={handleUpload}>Merge PDFs</button>

      <h2>History</h2>
      <ul>
        {history.map(job => (
          <li key={job.id}>
            {job.filename} -{" "}
            <a
              href={`http://localhost:4000/merged/${job.filename}`}
              download
              target="_blank"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
  
}
