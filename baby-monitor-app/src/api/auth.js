import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://baby-monitor-1.onrender.com/api";

export const registerUser = async (userData) => {
  const res = await axios.post(`${API_URL}/register`, userData, { withCredentials: true });
  return res.data;
};

export const loginUser = async (credentials) => {
  const res = await axios.post(`${API_URL}/login`, credentials, { withCredentials: true });
  return res.data;
};

export const logoutUser = async () => {
  const res = await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
  return res.data;
};
