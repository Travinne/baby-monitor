import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";

function BabyProfile() {
  const token = localStorage.getItem("token");

  const [baby, setBaby] = useState({
    id: null,
    fullName: "",
    dob: "",
    gender: "",
    weight: "",
    height: "",
    photo: "",
    photoFile: null,
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateField = (name, value) => {
    let newErrors = { ...errors };
    if (name === "fullName" && value.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    } else if (name === "dob" && value && new Date(value) > new Date()) {
      newErrors.dob = "Date cannot be in the future";
    } else delete newErrors[name];
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    setBaby({ ...baby, [e.target.name]: e.target.value });
    validateField(e.target.name, e.target.value);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Invalid image!");
    setBaby({
      ...baby,
      photo: URL.createObjectURL(file),
      photoFile: file,
    });
  };

  const fetchBaby = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/babyprofile/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!data || !data.id) {
        setIsLoading(false);
        return;
      }

      setBaby({
        id: data.id,
        fullName: data.fullName || "",
        dob: data.dob ? data.dob.split("T")[0] : "",
        gender: data.gender || "",
        weight: data.weight || "",
        height: data.height || "",
        notes: data.notes || "",
        photo: data.photo ? `http://127.0.0.1:5000${data.photo}` : "",
        photoFile: null,
      });
    } catch (err) {
      console.log("Profile fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!baby.fullName || !baby.dob) {
      return alert("Name and DOB are required!");
    }

    setIsSaving(true);

    const url = baby.id
      ? `http://127.0.0.1:5000/api/babyprofile/${baby.id}`
      : `http://127.0.0.1:5000/api/babyprofile/`;

    const method = baby.id ? "PUT" : "POST";

    const formData = new FormData();
    Object.entries({
      fullName: baby.fullName,
      dob: baby.dob,
      gender: baby.gender,
      weight: baby.weight,
      height: baby.height,
      notes: baby.notes,
    }).forEach(([key, val]) => formData.append(key, val));

    if (baby.photoFile) formData.append("photo", baby.photoFile);

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Save failed!");

      alert("Profile saved!");
      fetchBaby();
    } catch (err) {
      console.log(err);
      alert("Could not save profile");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchBaby();
  }, []);

  if (isLoading) return <p className="loading">Loading...</p>;

  return (
    <div className="container">
      <BackButton />
      <h1 className="title">Baby Profile</h1>

      <div className="log-item" style={{ textAlign: "center" }}>
        {baby.photo ? (
          <img
            src={baby.photo}
            alt="Baby"
            className="profile-photo"
            style={{
              width: "130px",
              height: "130px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "15px",
            }}
          />
        ) : (
          <div className="photo-placeholder">No Photo</div>
        )}

        <label htmlFor="photoInput" className="btn btn-secondary">
          {baby.photo ? "Change" : "Upload"} Photo
        </label>
        <input
          id="photoInput"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      <form className="form">
        <label>Full Name</label>
        <input
          className="input"
          name="fullName"
          value={baby.fullName}
          onChange={handleChange}
          placeholder="Baby's name"
        />

        <label>Date of Birth</label>
        <input
          type="date"
          className="input"
          name="dob"
          value={baby.dob}
          onChange={handleChange}
        />

        <label>Gender</label>
        <select className="input" name="gender" value={baby.gender} onChange={handleChange}>
          <option value="">Select</option>
          <option value="Male">Boy</option>
          <option value="Female">Girl</option>
        </select>

        <label>Weight (kg)</label>
        <input className="input" name="weight" value={baby.weight} onChange={handleChange} />

        <label>Height (cm)</label>
        <input className="input" name="height" value={baby.height} onChange={handleChange} />

        <label>Notes</label>
        <textarea className="input" name="notes" value={baby.notes} onChange={handleChange} />
      </form>

      <button className="btn btn-secondary" onClick={handleSave}>
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}

export default BabyProfile;
