import { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { getAllergies, addAllergy, deleteAllergy } from "../api/allergies";

export default function Allergies() {
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    severity: "",
    reaction: "",
    notes: "",
    diagnosed_date: ""
  });

  useEffect(() => {
    fetchAllergies();
  }, []);

  const fetchAllergies = async () => {
    try {
      const data = await getAllergies();
      setAllergies(data);
    } catch {
      setMessage("Failed to load allergies!");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const newAllergy = await addAllergy(formData);
      setAllergies([...allergies, newAllergy]);
      setMessage("Allergy added!");
      setFormData({ name: "", severity: "", reaction: "", notes: "", diagnosed_date: "" });
    } catch {
      setMessage("Failed to add allergy!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAllergy(id);
      setAllergies(allergies.filter(a => a.id !== id));
    } catch {
      setMessage("Failed to remove allergy!");
    }
  };

  const severityColor = (level) => {
    const lv = level?.toLowerCase();
    if (lv === "mild") return "#f6ad55";
    if (lv === "moderate") return "#ed8936";
    if (lv === "severe") return "#e53e3e";
    return "#718096";
  };

  const exportAllergies = () => {
    if (!allergies.length) return alert("Nothing to export!");
    const content = allergies.map(a => `• ${a.name} — ${a.severity}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baby-allergies-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Allergies & Sensitivities</h2>
      {message && <p className="info-message">{message}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <label>Allergy Name *</label>
        <input name="name" value={formData.name} onChange={handleChange} required placeholder="E.g., Peanuts, Milk, Dust" />

        <label>Severity *</label>
        <select name="severity" value={formData.severity} onChange={handleChange} required>
          <option value="">Select Severity</option>
          <option>Mild</option>
          <option>Moderate</option>
          <option>Severe</option>
        </select>

        <label>Reaction</label>
        <input name="reaction" value={formData.reaction} onChange={handleChange} placeholder="Eg. rash, swelling" />

        <label>Notes</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Optional additional notes..." />

        <label>Diagnosed Date</label>
        <input type="date" name="diagnosed_date" value={formData.diagnosed_date} onChange={handleChange} />

        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Add Allergy"}
        </button>
      </form>

      <div className="section-header">
        <h3 className="history-title">Recorded Allergies</h3>
        {allergies.length > 0 && (
          <button className="btn btn-secondary" onClick={exportAllergies}>Export</button>
        )}
      </div>

      {loading ? <p>Loading...</p> :
        allergies.length === 0 ? <p className="empty">No allergies recorded. 🎉</p> :
        <ul className="log-list allergies">
          {allergies.map(a => (
            <li key={a.id} className="log-item">
              <h4 className="item-title">{a.name}</h4>
              <span style={{
                background: severityColor(a.severity),
                padding: "4px 10px",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.85em",
                fontWeight: "bold"
              }}>{a.severity}</span>
              {a.reaction && <p>Reaction: {a.reaction}</p>}
              {a.diagnosed_date && <p>Diagnosed: {new Date(a.diagnosed_date).toLocaleDateString()}</p>}
              {a.notes && <p>Notes: {a.notes}</p>}
              <button className="btn delete-btn" onClick={() => handleDelete(a.id)}>Remove</button>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
