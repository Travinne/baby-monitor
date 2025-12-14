import { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { getFeedings, addFeeding, deleteFeeding } from "../api/feeding.js";

export default function FeedingTracker() {
  const [feedings, setFeedings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastFeed, setLastFeed] = useState(null);

  const [formData, setFormData] = useState({ food_type: "", amount: "", notes: "" });
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const fetchFeedings = async () => {
    setLoading(true);
    try {
      const data = await getFeedings();
      const sorted = data.sort((a, b) => new Date(b.time) - new Date(a.time));
      setFeedings(sorted);
      if (sorted.length > 0) setLastFeed(sorted[0].time);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load feeding records!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedings();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.food_type || !formData.amount) return alert("Please fill in required fields.");
    setSubmitting(true);
    setMessage(null);

    try {
      const newFeed = { ...formData, time: new Date().toISOString() };
      const added = await addFeeding(newFeed);
      setFeedings([added, ...feedings]);
      setLastFeed(added.time);
      setFormData({ food_type: "", amount: "", notes: "" });
      setMessage("Feeding record added!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to add feeding record!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feeding record?")) return;
    try {
      await deleteFeeding(id);
      setFeedings(feedings.filter((f) => f.id !== id));
      setMessage("Record deleted!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete feeding record!");
    }
  };

  // Timer
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

  const playAlarm = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1000;
    osc.type = "square";
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    setTimeout(() => osc.stop(), 800);
  };

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Feeding Tracker</h2>

      {message && <p className="info-message">{message}</p>}

      {lastFeed ? (
        <p className="last-feed">
          Last Feed: <strong>{new Date(lastFeed).toLocaleString()}</strong>
        </p>
      ) : (
        <p className="last-feed">No feeding records yet.</p>
      )}

      <form onSubmit={handleSubmit} className="form">
        <input
          name="food_type"
          value={formData.food_type}
          onChange={handleChange}
          placeholder="Food Type (e.g., Milk)"
          required
        />
        <input
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Amount (e.g., 120ml)"
          required
        />
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes (optional)"
          rows="2"
        />
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Saving..." : "Add Feeding"}
        </button>
      </form>

      <h3 className="history-title">Feeding History</h3>
      {loading ? (
        <p>Loading...</p>
      ) : feedings.length === 0 ? (
        <p className="empty">No feeding records yet</p>
      ) : (
        <ul className="log-list">
          {feedings.map((feed) => (
            <li key={feed.id} className="log-item">
              <div>
                <strong>{feed.food_type}</strong> — {feed.amount}
                {feed.notes && <p className="log-notes">{feed.notes}</p>}
                <p className="log-time">{new Date(feed.time).toLocaleString()}</p>
              </div>
              <button className="btn delete-btn" onClick={() => handleDelete(feed.id)}>
                Remove
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
          disabled={isRunning}
        />
        <input
          type="number"
          min="0"
          max="59"
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
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

      {isRunning && timeLeft !== null && <p className="countdown">Time left: {formatTime(timeLeft)}</p>}
    </div>
  );
}
