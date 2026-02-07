"use client";

import { useState } from "react";

export default function ApiTestPage() {
  const [vehicleId, setVehicleId] = useState("1");
  const [driverId, setDriverId] = useState("5");
  const [distance, setDistance] = useState("120");
  const [duration, setDuration] = useState("90");
  const [date, setDate] = useState("2026-01-27");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    setLoading(true);
    setMsg("");

    const payload = {
      vehicle_id: Number(vehicleId),
      driver_id: Number(driverId),
      distance: Number(distance),
      duration: Number(duration),
      date: date,
    };

    try {
      const res = await fetch("http://localhost:8080/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.message ?? "Erreur API.");
      } else {
        setMsg("✅ Données envoyées et stockées en RAW (API).");
      }
    } catch (e: any) {
      setMsg("Erreur réseau: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 700 }}>
      <h1>Test API (POST /api/data)</h1>

      <div style={{ display: "grid", gap: 10 }}>
        <label>
          vehicle_id
          <input value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} />
        </label>

        <label>
          driver_id
          <input value={driverId} onChange={(e) => setDriverId(e.target.value)} />
        </label>

        <label>
          distance
          <input value={distance} onChange={(e) => setDistance(e.target.value)} />
        </label>

        <label>
          duration
          <input value={duration} onChange={(e) => setDuration(e.target.value)} />
        </label>

        <label>
          date (YYYY-MM-DD)
          <input value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button onClick={send} disabled={loading}>
          {loading ? "Envoi..." : "Envoyer"}
        </button>

        {msg && <p>{msg}</p>}
      </div>
    </main>
  );
}
