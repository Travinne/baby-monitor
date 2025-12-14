import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "https://baby-monitor-1.onrender.com/api/allergies";

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

export const getAllergies = async () => {
  const token = getToken();
  const res = await axios.get(BASE_URL, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const addAllergy = async (data) => {
  const token = getToken();
  const res = await axios.post(BASE_URL, data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const updateAllergy = async (id, data) => {
  const token = getToken();
  const res = await axios.put(`${BASE_URL}/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const deleteAllergy = async (id) => {
  const token = getToken();
  const res = await axios.delete(`${BASE_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
