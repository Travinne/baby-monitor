import { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { getGrowth, addGrowth, deleteGrowth } from "../api/growth.js";

export default function GrowthTracker() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ weight: "", height: "", notes: "" });

  const fetchEntries = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getGrowth();
      const sorted = data.sort((a, b) => new Date(b.time) - new Date(a.time));
      setEntries(sorted);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load growth records!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.weight || !formData.height) return alert("Please enter both weight and height");
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = { ...formData, time: new Date().toISOString() };
      const added = await addGrowth(payload);
      setEntries([added, ...entries]);
      setFormData({ weight: "", height: "", notes: "" });
      setMessage("Growth record added!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to add growth record!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteGrowth(id);
      setEntries(entries.filter((e) => e.id !== id));
      setMessage("Record deleted!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete growth record!");
    }
  };

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Growth Tracker</h2>

      {message && <p className="info-message">{message}</p>}

      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <input
            type="number"
            step="0.01"
            name="weight"
            placeholder="Weight (kg) *"
            value={formData.weight}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            step="0.1"
            name="height"
            placeholder="Height (cm) *"
            value={formData.height}
            onChange={handleChange}
            required
          />
        </div>

        <textarea
          name="notes"
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
        />

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Saving..." : "Add Entry"}
        </button>
      </form>

      <h3 className="history-title">Growth History</h3>
      {loading ? (
        <p>Loading growth records...</p>
      ) : entries.length === 0 ? (
        <p className="empty">No growth records yet</p>
      ) : (
        <ul className="log-list">
          {entries.map((entry) => (
            <li key={entry.id} className="log-item">
              <div>
                <strong>
                  {entry.weight} kg | {entry.height} cm
                </strong>
                {entry.notes && <p className="log-notes">{entry.notes}</p>}
                <p className="log-time">{new Date(entry.time).toLocaleString()}</p>
              </div>
              <button className="btn delete-btn" onClick={() => handleDelete(entry.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
