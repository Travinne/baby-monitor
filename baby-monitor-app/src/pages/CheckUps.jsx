import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { getCheckups, addCheckup, deleteCheckup } from "../api/checkups.js";

function Checkups() {
  const [checkups, setCheckups] = useState([]);
  const [doctorName, setDoctorName] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [shortDays, setShortDays] = useState("");
  const [shortHours, setShortHours] = useState("");
  const [shortTimeLeft, setShortTimeLeft] = useState(null);
  const [shortRunning, setShortRunning] = useState(false);

  const [longMonths, setLongMonths] = useState("");
  const [longYears, setLongYears] = useState("");
  const [longTimeLeft, setLongTimeLeft] = useState(null);
  const [longRunning, setLongRunning] = useState(false);

  const fetchCheckups = async () => {
    try {
      const data = await getCheckups();
      setCheckups(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error(err);
      alert("Failed to load checkups");
    }
  };

  const handleAddCheckup = async () => {
    if (!doctorName || !reason || !date) return alert("All fields are required");
    setIsSaving(true);
    try {
      const added = await addCheckup({ doctorName, reason, date });
      setCheckups([added, ...checkups]);
      setDoctorName("");
      setReason("");
      setDate("");
    } catch (err) {
      console.error(err);
      alert("Failed to add checkup");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCheckup = async (id) => {
    if (!window.confirm("Are you sure you want to delete this checkup?")) return;
    try {
      await deleteCheckup(id);
      setCheckups(checkups.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete checkup");
    }
  };

  useEffect(() => {
    fetchCheckups();
  }, []);

  // Short-term countdown
  useEffect(() => {
    let countdown;
    if (shortRunning && shortTimeLeft > 0) {
      countdown = setInterval(() => setShortTimeLeft(prev => prev - 1), 1000);
    } else if (shortTimeLeft === 0) {
      alert("Time for your short-term checkup reminder!");
      setShortRunning(false);
      setShortTimeLeft(null);
    }
    return () => clearInterval(countdown);
  }, [shortRunning, shortTimeLeft]);

  // Long-term countdown
  useEffect(() => {
    let countdown;
    if (longRunning && longTimeLeft > 0) {
      countdown = setInterval(() => setLongTimeLeft(prev => prev - 1), 1000);
    } else if (longTimeLeft === 0) {
      alert("Time for your long-term checkup reminder!");
      setLongRunning(false);
      setLongTimeLeft(null);
    }
    return () => clearInterval(countdown);
  }, [longRunning, longTimeLeft]);

  const handleStartShortTimer = () => {
    const d = parseInt(shortDays) || 0;
    const h = parseInt(shortHours) || 0;
    if (d === 0 && h === 0) return alert("Enter days or hours");
    setShortTimeLeft(d * 86400 + h * 3600);
    setShortRunning(true);
  };

  const handleStartLongTimer = () => {
    const m = parseInt(longMonths) || 0;
    const y = parseInt(longYears) || 0;
    if (m === 0 && y === 0) return alert("Enter months or years");
    setLongTimeLeft(m * 2628000 + y * 31536000);
    setLongRunning(true);
  };

  const formatTime = (seconds) => {
    const y = Math.floor(seconds / 31536000);
    const m = Math.floor((seconds % 31536000) / 2628000);
    const d = Math.floor((seconds % 2628000) / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${y > 0 ? y + "y " : ""}${m > 0 ? m + "m " : ""}${d > 0 ? d + "d " : ""}${h}h ${min}m ${s}s`;
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString();

  return (
    <div className="container">
      <BackButton />
      <h2 className="title">Checkups Tracker</h2>

      <div className="form">
        <input type="text" placeholder="Doctor's Name" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="input" />
        <input type="text" placeholder="Reason for Checkup" value={reason} onChange={e => setReason(e.target.value)} className="input" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        <button onClick={handleAddCheckup} className="btn" disabled={isSaving}>
          {isSaving ? "Saving..." : "Add Checkup"}
        </button>
      </div>

      <h3 className="history-title">Checkup History</h3>
      {checkups.length === 0 ? <p>No checkups logged yet</p> : (
        <ul className="log-list">
          {checkups.map(c => (
            <li key={c.id} className="log-item">
              <strong>{c.doctorName}</strong> - {c.reason} <br />
              {formatDate(c.date)} <br />
              <button onClick={() => handleDeleteCheckup(c.id)} className="btn delete-btn">Delete</button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="history-title">Short-Term Reminder (Days/Hours)</h3>
      <div className="timer">
        <input type="number" min="0" placeholder="Days" value={shortDays} onChange={e => setShortDays(e.target.value)} className="input" disabled={shortRunning} />
        <input type="number" min="0" placeholder="Hours" value={shortHours} onChange={e => setShortHours(e.target.value)} className="input" disabled={shortRunning} />
        {!shortRunning ? (
          <button onClick={handleStartShortTimer} className="btn">Start Short Timer</button>
        ) : (
          <button onClick={() => { setShortRunning(false); setShortTimeLeft(null); setShortDays(""); setShortHours(""); }} className="btn remove-btn">Reset</button>
        )}
      </div>
      {shortRunning && shortTimeLeft !== null && <p className="countdown">Short-Term: {formatTime(shortTimeLeft)}</p>}

      <h3 className="history-title">Long-Term Reminder (Months/Years)</h3>
      <div className="timer">
        <input type="number" min="0" placeholder="Months" value={longMonths} onChange={e => setLongMonths(e.target.value)} className="input" disabled={longRunning} />
        <input type="number" min="0" placeholder="Years" value={longYears} onChange={e => setLongYears(e.target.value)} className="input" disabled={longRunning} />
        {!longRunning ? (
          <button onClick={handleStartLongTimer} className="btn">Start Long Timer</button>
        ) : (
          <button onClick={() => { setLongRunning(false); setLongTimeLeft(null); setLongMonths(""); setLongYears(""); }} className="btn remove-btn">Reset</button>
        )}
      </div>
      {longRunning && longTimeLeft !== null && <p className="countdown">Long-Term: {formatTime(longTimeLeft)}</p>}
    </div>
  );
}

export default Checkups;
