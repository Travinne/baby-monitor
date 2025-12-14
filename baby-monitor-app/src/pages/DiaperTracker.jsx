import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { getDiapers, addDiaper, deleteDiaper } from "../api/diapers.js";

function DiaperTracker() {
  const [entries, setEntries] = useState([]);
  const [messType, setMessType] = useState("");
  const [notes, setNotes] = useState("");
  const [lastChange, setLastChange] = useState(null);

  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const fetchEntries = async () => {
    try {
      const data = await getDiapers();
      const sorted = data.sort((a, b) => new Date(b.time) - new Date(a.time));
      setEntries(sorted);
      if (sorted.length > 0) setLastChange(sorted[0].time);
    } catch (err) {
      console.error("Failed to fetch diaper entries:", err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const playAlarm = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 700;
        osc.type = "square";
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        setTimeout(() => osc.stop(), 250);
      }, i * 350);
    }
  };

  const handleAddEntry = async () => {
    if (!messType) return alert("Please select a mess type");
    const now = new Date().toISOString();
    try {
      const added = await addDiaper({ messType, notes: notes || "No notes", time: now });
      setEntries([added, ...entries]);
      setLastChange(added.time);
      setMessType("");
      setNotes("");
    } catch (err) {
      console.error(err);
      alert("Could not add entry. Try again.");
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Delete this diaper entry?")) return;
    try {
      await deleteDiaper(id);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete entry.");
    }
  };

  useEffect(() => {
    let countdown;
    if (isRunning && timeLeft > 0) {
      countdown = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      playAlarm();
      alert("Time to check the baby's diaper!");
      setIsRunning(false);
      setTimeLeft(null);
    }
    return () => clearInterval(countdown);
  }, [isRunning, timeLeft]);

  const handleStartTimer = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    if (h === 0 && m === 0) return alert("Please enter hours or minutes");
    setTimeLeft(h * 3600 + m * 60);
    setIsRunning(true);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(null);
    setHours("");
    setMinutes("");
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const getMessTypeStats = () => {
    const stats = { Pee: 0, Poop: 0, Mixed: 0 };
    entries.forEach((entry) => {
      if (stats[entry.messType] !== undefined) stats[entry.messType]++;
    });
    return stats;
  };

  const stats = getMessTypeStats();

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Diaper Tracker</h2>

      {lastChange ? (
        <p className="last-change">
          Last change: <strong>{new Date(lastChange).toLocaleString()}</strong>
        </p>
      ) : (
        <p className="last-change">No diaper changes logged yet</p>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Changes</span>
          <span className="stat-value">{entries.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pee</span>
          <span className="stat-value">{stats.Pee}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Poop</span>
          <span className="stat-value">{stats.Poop}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Mixed</span>
          <span className="stat-value">{stats.Mixed}</span>
        </div>
      </div>

      <div className="form">
        <select value={messType} onChange={(e) => setMessType(e.target.value)} className="select">
          <option value="">Select Mess Type</option>
          <option value="Pee">Pee</option>
          <option value="Poop">Poop</option>
          <option value="Mixed">Mixed</option>
        </select>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows="2"
        />
        <button onClick={handleAddEntry} className="btn btn-primary">Add Entry</button>
      </div>

      <h3 className="history-title">Change History</h3>
      {entries.length === 0 ? (
        <p className="empty">No history yet</p>
      ) : (
        <ul className="log-list">
          {entries.map((entry) => (
            <li key={entry.id} className="log-item">
              <div>
                <span className="log-mess">{entry.messType}</span>
                {entry.notes !== "No notes" && <p className="log-notes">{entry.notes}</p>}
              </div>
              <div className="log-actions">
                <span className="time">{new Date(entry.time).toLocaleString()}</span>
                <button onClick={() => handleDeleteEntry(entry.id)} className="btn-icon delete-btn" title="Delete" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="history-title">Set Change Reminder</h3>
      <div className="form">
        <input type="number" min="0" placeholder="Hours" value={hours} onChange={(e) => setHours(e.target.value)} className="input" disabled={isRunning} />
        <input type="number" min="0" placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="input" disabled={isRunning} />
        {!isRunning ? (
          <button onClick={handleStartTimer} className="btn btn-secondary">Start Reminder</button>
        ) : (
          <button onClick={handleResetTimer} className="btn remove-btn">Reset Reminder</button>
        )}
      </div>

      {isRunning && timeLeft !== null && (
        <p className="countdown">Next check in: {formatTime(timeLeft)}</p>
      )}
    </div>
  );
}

export default DiaperTracker;
