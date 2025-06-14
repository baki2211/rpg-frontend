import axios from "axios";
import { API_URL } from "../../config/api";

export const api = {
  get: async (url: string) => {
    try {
      const response = await axios.get(`${API_URL}${url}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API GET ${url} failed:`, error);
      throw error;
    }
  },
  post: async (url: string, data: JSON) => {
    try {
      const response = await axios.post(`${API_URL}${url}`, data, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API POST ${url} failed:`, error);
      throw error;
    }
  },
  put: async (url: string, data?: JSON) => {
    try {
      const response = await axios.put(`${API_URL}${url}`, data, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API PUT ${url} failed:`, error);
      throw error;
    }
  },
  delete: async (url: string) => {
    try {
      const response = await axios.delete(`${API_URL}${url}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API DELETE ${url} failed:`, error);
      throw error;
    }
  },
};
