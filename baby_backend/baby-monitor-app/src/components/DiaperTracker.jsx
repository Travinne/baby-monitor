import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";

function DiaperTracker() {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("diaperEntries");
    return saved ? JSON.parse(saved) : [];
  });
  const [messType, setMessType] = useState("");
  const [notes, setNotes] = useState("");
  const [lastChange, setLastChange] = useState(null);

  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (entries.length > 0) {
      setLastChange(entries[0].time);
      localStorage.setItem("diaperEntries", JSON.stringify(entries));
    }
  }, [entries]);

  const playAlarm = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 700;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 250);
      }, i * 350);
    }
  };

  const handleAddEntry = () => {
    if (!messType) {
      alert("Please select a mess type");
      return;
    }

    const now = new Date().toLocaleString();
    const newEntry = { 
      messType, 
      notes: notes || "No notes",
      time: now 
    };

    setEntries([newEntry, ...entries]);
    setLastChange(now);
    setMessType("");
    setNotes("");
  };

  const handleDeleteEntry = (index) => {
    if (window.confirm("Delete this diaper change entry?")) {
      const updated = entries.filter((_, i) => i !== index);
      setEntries(updated);
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
      alert("Time to check the baby's diaper!");
      setIsRunning(false);
      setTimeLeft(null);
    }
    return () => clearInterval(countdown);
  }, [isRunning, timeLeft]);

  const handleStartTimer = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    
    if (h === 0 && m === 0) {
      alert("Please enter hours or minutes");
      return;
    }

    const totalSeconds = h * 3600 + m * 60;
    setTimeLeft(totalSeconds);
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
    entries.forEach(entry => {
      if (stats[entry.messType] !== undefined) {
        stats[entry.messType]++;
      }
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
          Last change: <strong>{lastChange}</strong>
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
        <div className="form-group">
          <label htmlFor="messType">Mess Type</label>
          <select
            id="messType"
            className="select"
            value={messType}
            onChange={(e) => setMessType(e.target.value)}
          >
            <option value="">Select Mess Type</option>
            <option value="Pee">Pee</option>
            <option value="Poop">Poop</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            placeholder="Any observations (color, consistency, rash, etc.)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            rows="2"
          />
        </div>

        <button onClick={handleAddEntry} className="btn btn-primary">
          Add Entry
        </button>
      </div>

      <h3 className="history-title">Change History</h3>
      {entries.length === 0 ? (
        <p className="empty">No history yet</p>
      ) : (
        <ul className="log-list">
          {entries.map((entry, index) => (
            <li key={index} className="log-item">
              <div>
                <span className="log-mess">{entry.messType}</span>
                {entry.notes !== "No notes" && (
                  <p className="log-notes">{entry.notes}</p>
                )}
              </div>
              <div className="log-actions">
                <span className="time">{entry.time}</span>
                <button 
                  onClick={() => handleDeleteEntry(index)}
                  className="btn-icon delete-btn"
                  title="Delete"
                >
                
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="history-title">Set Change Reminder</h3>
      <div className="form">
        <div className="input-group">
          <div className="form-group">
            <label htmlFor="hours">Hours</label>
            <input
              id="hours"
              type="number"
              min="0"
              max="24"
              placeholder="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="input"
              disabled={isRunning}
            />
          </div>
          <div className="form-group">
            <label htmlFor="minutes">Minutes</label>
            <input
              id="minutes"
              type="number"
              min="0"
              max="59"
              placeholder="0"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="input"
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="timer-controls">
          {!isRunning ? (
            <button onClick={handleStartTimer} className="btn btn-secondary">
              Start Reminder
            </button>
          ) : (
            <button onClick={handleResetTimer} className="btn remove-btn">
              Reset Reminder
            </button>
          )}
        </div>
      </div>

      {isRunning && timeLeft !== null && (
        <div className="countdown-card">
          <p className="countdown-label">Next check in:</p>
          <p className="countdown">{formatTime(timeLeft)}</p>
        </div>
      )}
    </div>
  );
}

export default DiaperTracker;