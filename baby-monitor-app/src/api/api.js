import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Add token if needed
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const fetchData = (endpoint) => API.get(endpoint);
export const postData = (endpoint, data) => API.post(endpoint, data);
export const deleteData = (endpoint) => API.delete(endpoint);

export default API;
