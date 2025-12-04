import axios from "axios";


const BASE_URL =
  process.env.REACT_APP_API_URL || "https://baby-monitor-1.onrender.com/api";

const API = axios.create({
  baseURL: BASE_URL,
});


API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});


export const postData = (endpoint, data) => API.post(endpoint, data);
export const fetchData = (endpoint) => API.get(endpoint);
export const deleteData = (endpoint) => API.delete(endpoint);

export default API;
