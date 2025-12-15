import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "https://baby-monitor-3vgm.onrender.com/api/feeding";

export const getFeedings = async () => {
  const res = await axios.get(API_URL, { withCredentials: true });
  return res.data;
};

export const addFeeding = async (data) => {
  const res = await axios.post(API_URL, data, { withCredentials: true });
  return res.data;
};

export const deleteFeeding = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
  return res.data;
};
