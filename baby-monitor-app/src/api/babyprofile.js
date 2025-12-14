import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://baby-monitor-1.onrender.com/api/babyprofile";

export const getBabyProfile = async () => {
  const res = await axios.get(API_URL, { withCredentials: true });
  return res.data;
};

export const addBabyProfile = async (babyData) => {
  const res = await axios.post(API_URL, babyData, { withCredentials: true });
  return res.data;
};

export const updateBabyProfile = async (id, babyData) => {
  const res = await axios.put(`${API_URL}/${id}`, babyData, { withCredentials: true });
  return res.data;
};

export const deleteBabyProfile = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
  return res.data;
};
