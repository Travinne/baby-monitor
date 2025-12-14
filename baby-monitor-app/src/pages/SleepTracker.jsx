import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { getSleeps, addSleep, deleteSleep } from "../api/sleep.js";

export default function SleepTracker() {
  const [sleepStart, setSleepStart] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    loadRecords();
  }, [token]);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSleeps();
      const sorted = Array.isArray(res) ? res.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)) : [];
      setRecords(sorted);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sleep records");
    } finally {
      setLoading(false);
    }
  };

  const startSleep = () => setSleepStart(new Date());

  const endSleep = async () => {
    if (!sleepStart) return setError("Start sleep first!");

    const end = new Date();
    const duration = Math.floor((end - sleepStart) / 1000 / 60); // minutes
    const payload = {
      start_time: sleepStart.toISOString(),
      end_time: end.toISOString(),
      duration: `${duration} minutes`,
    };

    try {
      const res = await addSleep(payload);
      setRecords((prev) => [res, ...prev]);
      setSleepStart(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add sleep record");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSleep(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete sleep record");
    }
  };

  if (loading) return <p>Loading sleep data...</p>;

  return (
    <div className="container">
      <BackButton />
      <h2>Sleep Tracker</h2>

      {!sleepStart ? (
        <button onClick={startSleep} className="btn">
          Start Sleep
        </button>
      ) : (
        <button onClick={endSleep} className="btn">
          End Sleep
        </button>
      )}

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <h3>Sleep Records</h3>
      {records.length === 0 ? (
        <p>No sleep records yet</p>
      ) : (
        <ul className="log-list">
          {records.map((r) => (
            <li key={r.id} className="log-item">
              <div>
                <span className="log-mess">
                  Start: {new Date(r.start_time).toLocaleString()} <br />
                  End: {new Date(r.end_time).toLocaleString()} <br />
                  Duration: {r.duration}
                </span>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
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
