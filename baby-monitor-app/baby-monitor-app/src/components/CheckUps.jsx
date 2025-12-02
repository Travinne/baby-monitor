import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";


function Checkups() {
  const [checkups, setCheckups] = useState([]);
  const [doctorName, setDoctorName] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");

  const [shortDays, setShortDays] = useState("");
  const [shortHours, setShortHours] = useState("");
  const [shortTimeLeft, setShortTimeLeft] = useState(null);
  const [shortRunning, setShortRunning] = useState(false);

  const [longMonths, setLongMonths] = useState("");
  const [longYears, setLongYears] = useState("");
  const [longTimeLeft, setLongTimeLeft] = useState(null);
  const [longRunning, setLongRunning] = useState(false);

  const handleAddCheckup = () => {
    if (!doctorName || !reason || !date) return;
    const newCheckup = { doctorName, reason, date };
    setCheckups([newCheckup, ...checkups]);
    setDoctorName("");
    setReason("");
    setDate("");
  };

  useEffect(() => {
    let countdown;
    if (shortRunning && shortTimeLeft > 0) {
      countdown = setInterval(() => {
        setShortTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (shortTimeLeft === 0) {
      alert(" Time for your short-term checkup reminder!");
      setShortRunning(false);
    }
    return () => clearInterval(countdown);
  }, [shortRunning, shortTimeLeft]);

  useEffect(() => {
    let countdown;
    if (longRunning && longTimeLeft > 0) {
      countdown = setInterval(() => {
        setLongTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (longTimeLeft === 0) {
      alert("Time for your long-term checkup reminder!");
      setLongRunning(false);
    }
    return () => clearInterval(countdown);
  }, [longRunning, longTimeLeft]);

  const handleStartShortTimer = () => {
    const d = parseInt(shortDays) || 0;
    const h = parseInt(shortHours) || 0;
    if (d === 0 && h === 0) return;
    const totalSeconds = d * 86400 + h * 3600;
    setShortTimeLeft(totalSeconds);
    setShortRunning(true);
  };

  const handleStartLongTimer = () => {
    const m = parseInt(longMonths) || 0;
    const y = parseInt(longYears) || 0;
    if (m === 0 && y === 0) return;
    const totalSeconds = m * 2628000 + y * 31536000;
    setLongTimeLeft(totalSeconds);
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

  return (
    <div className="container">
       <BackButton />
      <h2 className="title"> Checkups Tracker</h2>

      <div className="form">
        <input
          type="text"
          placeholder="Doctor's Name"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Reason for Checkup"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
        />
        <button onClick={handleAddCheckup} className="btn">Add Checkup</button>
      </div>

      <h3 className="history-title">Checkup History</h3>
      {checkups.length === 0 ? (
        <p>No checkups logged yet</p>
      ) : (
        <ul className="log-list">
          {checkups.map((checkup, index) => (
            <li key={index} className="log-item">
              <strong>{checkup.doctorName}</strong> - {checkup.reason} <br />
              {checkup.date}
            </li>
          ))}
        </ul>
      )}

      <h3 className="history-title">Short-Term Reminder (Days/Hours)</h3>
      <div className="timer">
        <input
          type="number"
          min="0"
          placeholder="Days"
          value={shortDays}
          onChange={(e) => setShortDays(e.target.value)}
          className="input"
        />
        <input
          type="number"
          min="0"
          placeholder="Hours"
          value={shortHours}
          onChange={(e) => setShortHours(e.target.value)}
          className="input"
        />
        <button onClick={handleStartShortTimer} className="btn">Start Short Timer</button>
      </div>
      {shortRunning && shortTimeLeft !== null && (
        <p className="countdown">Short-Term: {formatTime(shortTimeLeft)}</p>
      )}

      <h3 className="history-title">Long-Term Reminder (Months/Years)</h3>
      <div className="timer">
        <input
          type="number"
          min="0"
          placeholder="Months"
          value={longMonths}
          onChange={(e) => setLongMonths(e.target.value)}
          className="input"
        />
        <input
          type="number"
          min="0"
          placeholder="Years"
          value={longYears}
          onChange={(e) => setLongYears(e.target.value)}
          className="input"
        />
        <button onClick={handleStartLongTimer} className="btn">Start Long Timer</button>
      </div>
      {longRunning && longTimeLeft !== null && (
        <p className="countdown">Long-Term: {formatTime(longTimeLeft)}</p>
      )}
    </div>
  );
}

export default Checkups;
