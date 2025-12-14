import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "https://baby-monitor-1.onrender.com/api/settings";

export const getSettings = async (userId) => {
  const res = await axios.get(`${API_URL}/${userId}`, { withCredentials: true });
  return res.data;
};

export const updateSettings = async (userId, data) => {
  const res = await axios.put(`${API_URL}/${userId}`, data, { withCredentials: true });
  return res.data;
};
