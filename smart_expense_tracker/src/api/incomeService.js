import axiosInstance from "./axiosInstance";

export const getIncomes = async () => {
  return await axiosInstance.get("/incomes");
};

export const createIncome = async (data) => {
  return await axiosInstance.post("/incomes/create", data);
};

export const editIncome = async (data, id) => {
  return await axiosInstance.put(`/incomes/${id}`, data);
};

export const deleteIncome = async (id) => {
  return await axiosInstance.delete(`/incomes/${id}`);
};

export default axiosInstance;
