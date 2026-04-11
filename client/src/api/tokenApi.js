import axios from "axios";

console.log("API URL:", import.meta.env.VITE_API_URL); 

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export const fetchBranches = async () => {
  const response = await API.get("/data/branches");
  return response.data;
};

export const fetchServices = async () => {
  const response = await API.get("/data/services");
  return response.data;
};

export const generateToken = async (payload) => {
  const response = await API.post("/tokens", payload);
  return response.data;
};