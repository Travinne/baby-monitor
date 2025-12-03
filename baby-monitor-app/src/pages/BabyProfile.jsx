import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import API from "../api/api";

function BabyProfile() {
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

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === "fullName" && value.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    } else if (name === "dob" && value && new Date(value) > new Date()) {
      newErrors.dob = "Date cannot be in the future";
    } else {
      delete newErrors[name];
    }
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBaby({ ...baby, [name]: value });
    validateField(name, value);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Invalid image file");
    setBaby({
      ...baby,
      photo: URL.createObjectURL(file),
      photoFile: file,
    });
  };

  const fetchBaby = async () => {
    setIsLoading(true);
    try {
      const res = await API.get("/babyprofile/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      if (!data || !data.id) return;

      setBaby({
        id: data.id,
        fullName: data.fullName || "",
        dob: data.dob ? data.dob.split("T")[0] : "",
        gender: data.gender || "",
        weight: data.weight || "",
        height: data.height || "",
        notes: data.notes || "",
        photo: data.photo ? `${API.defaults.baseURL}${data.photo}` : "",
        photoFile: null,
      });
    } catch (err) {
      console.error("Error fetching baby profile:", err);
      alert("Could not load baby profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
   
    if (!baby.fullName || !baby.dob) {
      return alert("Full name and date of birth are required");
    }

    
    if (Object.keys(errors).length > 0) {
      return alert("Please fix the errors before saving");
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append("fullName", baby.fullName);
    formData.append("dob", baby.dob);
    formData.append("gender", baby.gender);
    formData.append("weight", baby.weight);
    formData.append("height", baby.height);
    formData.append("notes", baby.notes);
    if (baby.photoFile) formData.append("photo", baby.photoFile);

    try {
      if (baby.id) {
        await API.put(`/babyprofile/${baby.id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const res = await API.post("/babyprofile/", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBaby((prev) => ({ ...prev, id: res.data.id }));
      }

      alert("Profile saved successfully!");
      fetchBaby();
    } catch (err) {
      console.error("Error saving profile:", err);
      alert(err.response?.data?.message || "Could not save profile");
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

      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <label>Full Name</label>
        <input
          className="input"
          name="fullName"
          value={baby.fullName}
          onChange={handleChange}
        />
        {errors.fullName && <p className="error-message">{errors.fullName}</p>}

        <label>Date of Birth</label>
        <input
          type="date"
          className="input"
          name="dob"
          value={baby.dob}
          onChange={handleChange}
        />
        {errors.dob && <p className="error-message">{errors.dob}</p>}

        <label>Gender</label>
        <select
          className="input"
          name="gender"
          value={baby.gender}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Male">Boy</option>
          <option value="Female">Girl</option>
        </select>

        <label>Weight (kg)</label>
        <input
          className="input"
          name="weight"
          value={baby.weight}
          onChange={handleChange}
        />

        <label>Height (cm)</label>
        <input
          className="input"
          name="height"
          value={baby.height}
          onChange={handleChange}
        />

        <label>Notes</label>
        <textarea
          className="input"
          name="notes"
          value={baby.notes}
          onChange={handleChange}
        />
      </form>

      <button className="btn btn-secondary" onClick={handleSave}>
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}

export default BabyProfile;
