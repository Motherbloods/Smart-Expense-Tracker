import axiosInstance from "./axiosInstance";

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

export default axiosInstance;
