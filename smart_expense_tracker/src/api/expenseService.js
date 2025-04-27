import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getExpenses = async () => {
  return await axiosInstance.get("/expenses");
};

export const createExpense = async (data) => {
  return await axiosInstance.post("/create", data);
};

export const editExpense = async (data, id) => {
  return await axiosInstance.put(`/${id}`, data);
};

export const deleteExpense = async (id) => {
  return await axiosInstance.delete(`/${id}`);
};
