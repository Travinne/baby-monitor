import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "https://baby-monitor-3vgm.onrender.com/api/diapers";

export const getDiapers = async () => {
  const res = await axios.get(API_URL, { withCredentials: true });
  return res.data;
};

export const addDiaper = async (data) => {
  const res = await axios.post(API_URL, data, { withCredentials: true });
  return res.data;
};

export const deleteDiaper = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
  return res.data;
};
