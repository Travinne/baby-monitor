import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";

function SleepTracker() {
  const [sleepStart, setSleepStart] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = "http://127.0.0.1:8000/api/sleeps/";

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch sleep records");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const startSleep = () => {
    setSleepStart(new Date());
  };

  const endSleep = async () => {
    if (!sleepStart) return alert("Start sleep first!");

    const end = new Date();
    const duration = Math.floor((end - sleepStart) / 1000 / 60);
    const payload = {
      start_time: sleepStart.toISOString(),
      end_time: end.toISOString(),
      duration: `${duration} minutes`,
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add record");
      const created = await res.json();
      setRecords((prev) => [created, ...prev]);
      setSleepStart(null);
    } catch (err) {
      setError(err.message);
    }
  };

  async function handleDelete(id) {
    await fetch(`${API_BASE}${id}`, { method: "DELETE" });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <p>Loading sleep data...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div className="container">
      <BackButton />
      <h2>Sleep Tracker</h2>
      {!sleepStart ? (
        <button onClick={startSleep}>Start Sleep</button>
      ) : (
        <button onClick={endSleep}>End Sleep</button>
      )}
      <h3>Sleep Records</h3>
      {records.map((r) => (
        <div key={r.id}>
          <p>
            Start: {new Date(r.start_time).toLocaleString()} <br />
            End: {new Date(r.end_time).toLocaleString()} <br />
            Duration: {r.duration}
          </p>
          <button onClick={() => handleDelete(r.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default SleepTracker;