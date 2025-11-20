import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);

  const [status, setStatus] = useState("");



  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const api_key = typeof window !== "undefined" ? localStorage.getItem("api_key") : "";

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

  const handleUpload = async () => {
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));

    try {
      const res = await api.post("/merge", formData, {
        headers: { "x-api-key": api_key },
      });
      alert("Merged: " + res.data.download_url);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <input type="file" multiple onChange={e => setFiles([...e.target.files])} />
      <button onClick={handleUpload}>Merge PDFs</button>

      <h2>History</h2>
      <ul>
        {history.map(job => (
          <li key={job.id}>
            {job.filename} - <a href={`http://localhost:4000/merged/${job.filename}`} target="_blank">Download</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
