import { message } from "antd";
import axios from "axios";

export const API = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401 && error.response.status === 404) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      message.error("Session expired. Please log in again.");
    }
    else if (error.response.status === 403) {
      window.location.href = "/login";
      message.error("You are not authorized to access this page.");
    }
    return Promise.reject(error);
  }
);

export const registerUser = async (data: {
  username: string;
  email: string;
  password: string;
  mobileNo: string;
}) => {
  try {
    const response = await API.post("/register", data);
    return response.data;
  } catch (error: any) {
    // Preserve the full error response
    throw error; // Instead of throwing just the message
  }
};

export const loginuser = async (data: {
  employeeId: string;
  password: string;
}) => {
  try {
    const response = await API.post("/login", data);
    return response.data;
  } catch (error: any) {
    throw error.response.data.message;
  }
};

// Api.ts
export const getCustomers = async (params: { search?: string } = {}) => {
  const res = await API.get("/backend/customers", { params });
  return res.data;
};

export const addCustomer = async (payload: any) => {
  const res = await API.post("/backend/customers", payload);
  return res.data;
};

export const getInvoicesByCustomer = async (customerId: string) => {
  const res = await API.get(`/backend/customers/${customerId}/invoices`);
  return res.data;
};

export const addInvoiceForCustomer = async (
  customerId: string,
  payload: any
) => {
  const res = await API.post(
    `/backend/customers/${customerId}/invoices`,
    payload
  );
  return res.data;
};