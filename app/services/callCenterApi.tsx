import axios from "axios";
import { Params } from "next/dist/server/request/params";
import { API, handleError } from "./allApi";


export const APIFormData = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

APIFormData.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const createTicket = async (data: FormData | Record<string, string>) => {
  try {
    const res = await APIFormData.post("/api/ticket_management/tickets/add", data);
    return res.data;
  } catch (error: unknown) {
    return handleError(error);
  }
};

export const ticketList = async (params: Params) => {
  try {
    const res = await API.get("/api/ticket_management/tickets/list", { params });
    return res.data;
  } catch (error: unknown) {
    return handleError(error);
  }
};


export const getTicketByUUID = async (uuid: string, params: Params) => {
  try {
    const res = await API.get(`/api/ticket_management/tickets/${uuid}`, { params });
    return res.data;
  } catch (error: unknown) {
    return handleError(error);
  }
};


export const UpdateTicket = async (uuid: string, data: FormData | Record<string, string>) => {
  try {
    const res = await APIFormData.post(`/api/ticket_management/tickets/update/${uuid}`, data);
    return res.data;
  } catch (error: unknown) {
    return handleError(error);
  }
};