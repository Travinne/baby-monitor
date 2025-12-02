import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";

function FeedingTracker() {
  const [feedings, setFeedings] = useState([]);
  const [formData, setFormData] = useState({
    food_type: "",
    amount: "",
    notes: "",
  });
  const [lastFeed, setLastFeed] = useState(null);

  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const API_BASE = "http://127.0.0.1:5000/api/feeding/";

  useEffect(() => {
    loadFeedings();
  }, []);

  const loadFeedings = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch feeding data");

      const data = await res.json();
      const sorted = Array.isArray(data)
        ? data.sort(
            (a, b) =>
              new Date(b.time || b.date || 0) - new Date(a.time || a.date || 0)
          )
        : [];

      setFeedings(sorted);
      if (sorted.length > 0) setLastFeed(sorted[0].time);
    } catch (err) {
      console.error("Error loading feeding data:", err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.food_type || !formData.amount) {
      alert("Please fill in the required fields.");
      return;
    }

    const newFeed = {
      food_type: formData.food_type.trim(),
      amount: formData.amount.trim(),
      notes: formData.notes.trim(),
      time: new Date().toISOString(),
    };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeed),
      });
      if (!res.ok) throw new Error("Failed to add feeding record");

      await loadFeedings();
      setFormData({ food_type: "", amount: "", notes: "" });
    } catch (err) {
      console.error("Error adding feeding:", err);
      alert("Error adding feeding record.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      setFeedings((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Error deleting feeding:", err);
    }
  };

  useEffect(() => {
    let countdown;
    if (isRunning && timeLeft > 0) {
      countdown = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      playAlarm();
      alert("Time to feed the baby!");
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

  const playAlarm = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 1000;
    oscillator.type = "square";
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 800);
  };

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Feeding Tracker</h2>

      {lastFeed ? (
        <p className="last-feed">
          Last Feed: <strong>{new Date(lastFeed).toLocaleString()}</strong>
        </p>
      ) : (
        <p className="last-feed">No feeding records yet.</p>
      )}

      <form onSubmit={handleSubmit} className="form">
        <label>Food Type</label>
        <input
          type="text"
          name="food_type"
          value={formData.food_type}
          onChange={handleChange}
          placeholder="e.g., Milk, Porridge"
          className="select"
          required
        />

        <label>Amount</label>
        <input
          type="text"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="e.g., 120ml or 1 cup"
          className="select"
          required
        />

        <label>Notes (optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="e.g., Baby didn’t finish"
          className="select"
          rows="2"
        />

        <button type="submit" className="btn">
          Add Feeding
        </button>
      </form>

      <h3 className="history-title">Feeding History</h3>
      {feedings.length === 0 ? (
        <p className="empty">No feeding records yet</p>
      ) : (
        <ul className="log-list">
          {feedings.map((feed) => (
            <li key={feed.id} className="log-item">
              <div>
                <strong>{feed.food_type}</strong> — {feed.amount}
                {feed.notes && (
                  <p style={{ fontSize: "0.85em", color: "#666" }}>
                    {feed.notes}
                  </p>
                )}
                <p style={{ fontSize: "0.85em", color: "#999" }}>
                  {feed.time
                    ? new Date(feed.time).toLocaleString()
                    : "Unknown time"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(feed.id)}
                className="btn delete-btn"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="history-title">Feeding Timer</h3>
      <div className="timer">
        <input
          type="number"
          min="0"
          max="24"
          placeholder="Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="select"
          disabled={isRunning}
        />
        <input
          type="number"
          min="0"
          max="59"
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
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
        <p className="countdown">Time left: {formatTime(timeLeft)}</p>
      )}
    </div>
  );
}

export default FeedingTracker;
