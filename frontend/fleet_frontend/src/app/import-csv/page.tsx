"use client";

import { useState } from "react";

export default function ImportCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function handleUpload() {
    if (!file) {
      setMsg("Choisis un fichier CSV.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8080/import/csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.message ?? "Erreur lors de l'import.");
      } else {
        setMsg(`✅ Import réussi : ${data.importedRows} lignes enregistrées (RAW).`);
      }
    } catch (e: any) {
      setMsg("Erreur réseau: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 700 }}>
      <h1>Import CSV (RAW)</h1>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Import..." : "Importer"}
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 24, opacity: 0.8 }}>
        Le CSV doit contenir ces colonnes : <b>vehicle_id, driver_id, distance, duration, date</b>
      </p>
    </main>
  );
}
