import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";

function BathTimeTracker() {
  const token = localStorage.getItem("token");
  const [entries, setEntries] = useState([]);
  const [notes, setNotes] = useState("");
  const [lastBath, setLastBath] = useState(null);
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const API_URL = "https://baby-monitor-1.onrender.com/api/baths/";

  const fetchEntries = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch bath records");
      const data = await res.json();
      const sorted = data.sort((a, b) => new Date(b.time) - new Date(a.time));
      setEntries(sorted);
      if (sorted.length > 0) setLastBath(sorted[0].time);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEntry = async () => {
    const now = new Date().toLocaleString();
    const newEntry = { time: now, notes: notes.trim() || "No notes" };
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEntry),
      });
      if (!res.ok) throw new Error("Failed to log bath");
      const added = await res.json();
      setEntries([added, ...entries]);
      setLastBath(added.time);
      setNotes("");
    } catch (err) {
      console.error(err);
      alert("Error logging bath entry. Please try again.");
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete record");
      const updated = entries.filter((entry) => entry.id !== id);
      setEntries(updated);
      if (updated.length === 0) setLastBath(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting bath record.");
    }
  };

  const playAlarm = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 500 + i * 100;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        setTimeout(() => osc.stop(), 300);
      }, i * 400);
    }
  };

  useEffect(() => {
    let countdown;
    if (isRunning && timeLeft > 0) {
      countdown = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playAlarm();
      alert("Time for your baby's bath!");
      setIsRunning(false);
      setTimeLeft(null);
    }
    return () => clearInterval(countdown);
  }, [isRunning, timeLeft]);

  const handleStartTimer = () => {
    const d = parseInt(days) || 0;
    const h = parseInt(hours) || 0;
    if (d === 0 && h === 0) return alert("Please enter at least one value (days or hours)");
    if (d < 0 || h < 0) return alert("Invalid time values");
    const totalSeconds = d * 86400 + h * 3600;
    setTimeLeft(totalSeconds);
    setIsRunning(true);
  };

  const handleResetTimer = () => {
    if (window.confirm("Reset bath reminder?")) {
      setIsRunning(false);
      setTimeLeft(null);
      setDays("");
      setHours("");
    }
  };

  const formatTime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
  };

  const calculateTimeSinceLastBath = () => {
    if (!lastBath) return null;
    const last = new Date(lastBath);
    const now = new Date();
    const diffMs = now - last;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return diffDays > 0 ? `${diffDays}d ${remainingHours}h ago` : `${diffHours}h ago`;
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Bath Time Tracker</h2>
      {lastBath ? (
        <>
          <p className="last-change">
            Last bath: <strong>{lastBath}</strong>
          </p>
          <p style={{ textAlign: "center", color: "#666", marginTop: "8px" }}>
            ({calculateTimeSinceLastBath()})
          </p>
        </>
      ) : (
        <p className="last-change">No baths logged yet</p>
      )}
      <div className="form">
        <label>Notes (optional)</label>
        <textarea
          placeholder="Temperature, products used, baby's mood, etc..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows="2"
        />
        <button onClick={handleAddEntry} className="btn">
          Log Bath
        </button>
      </div>
      <h3 className="history-title">Bath History</h3>
      {entries.length === 0 ? (
        <p className="empty">No history yet</p>
      ) : (
        <ul className="log-list">
          {entries.map((entry) => (
            <li key={entry.id} className="log-item">
              <div>
                <span className="log-feed">Bath</span>
                {entry.notes !== "No notes" && (
                  <p style={{ fontSize: "0.9em", color: "#666", marginTop: "4px" }}>
                    {entry.notes}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span className="time">{entry.time}</span>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="btn delete-btn"
                  style={{ padding: "4px 8px", fontSize: "0.9em" }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h3 className="history-title">Set Bath Reminder</h3>
      <div className="timer">
        <input
          type="number"
          min="0"
          placeholder="Days"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="select"
          disabled={isRunning}
        />
        <input
          type="number"
          min="0"
          placeholder="Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="select"
          disabled={isRunning}
        />
        {!isRunning ? (
          <button onClick={handleStartTimer} className="btn">
            Start Timer
          </button>
        ) : (
          <button onClick={handleResetTimer} className="btn remove-btn">
            Reset Timer
          </button>
        )}
      </div>
      {isRunning && timeLeft !== null && (
        <p className="countdown">Next bath in: {formatTime(timeLeft)}</p>
      )}
    </div>
  );
}

export default BathTimeTracker;
