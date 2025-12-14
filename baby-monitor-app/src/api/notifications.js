import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "https://baby-monitor-1.onrender.com/api/notifications";

export const getNotifications = async () => {
  const res = await axios.get(API_URL, { withCredentials: true });
  return res.data;
};

export const addNotification = async (data) => {
  const res = await axios.post(API_URL, data, { withCredentials: true });
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
  return res.data;
};
