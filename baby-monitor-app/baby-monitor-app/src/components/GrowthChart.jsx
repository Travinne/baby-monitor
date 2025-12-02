import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";

function GrowthTracker() {
  const [entries, setEntries] = useState([]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = "http://127.0.0.1:5000/api/growth/";

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to load growth records");

      const data = await res.json();
      const sorted = Array.isArray(data)
        ? data.sort(
            (a, b) =>
              new Date(b.time || b.date || 0) - new Date(a.time || a.date || 0)
          )
        : [];
      setEntries(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    setError(null);

    if (!weight || !height) {
      setError("Please enter both weight and height");
      return;
    }

    const payload = {
      weight: parseFloat(weight),
      height: parseFloat(height),
      notes: notes || "",
      time: new Date().toISOString(),
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to add entry");
      }

      const created = await res.json();
      setEntries((prev) => [created, ...prev]);
      setWeight("");
      setHeight("");
      setNotes("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteEntry(id) {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to delete entry");
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading growth records...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Growth Tracker</h2>

      <form onSubmit={handleAddEntry} className="form">
        <div className="input-group">
          <input
            type="number"
            step="0.01"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="select"
            required
          />
          <input
            type="number"
            step="0.1"
            placeholder="Height (cm)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="select"
            required
          />
        </div>

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows="2"
        />

        <button type="submit" className="btn">
          Add Entry
        </button>
      </form>

      <h3 className="history-title">Growth History</h3>
      {entries.length === 0 ? (
        <p className="empty">No growth records yet</p>
      ) : (
        <ul className="log-list">
          {entries.map((entry) => (
            <li key={entry.id} className="log-item">
              <div>
                <span className="log-mess">
                  {entry.weight} kg | {entry.height} cm
                  {entry.notes ? ` — ${entry.notes}` : ""}
                </span>
                <p style={{ fontSize: "0.85em", color: "#666", marginTop: 6 }}>
                  {entry.time
                    ? new Date(entry.time).toLocaleString()
                    : entry.date || "Unknown time"}
                </p>
              </div>
              <button
                onClick={() => handleDeleteEntry(entry.id)}
                className="btn delete-btn"
                style={{ padding: "6px 10px", fontSize: "0.9em" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GrowthTracker;