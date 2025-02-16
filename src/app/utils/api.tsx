import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

export const api = {
  get: async (url: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${url}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API GET ${url} failed:`, error);
      throw error;
    }
  },
  post: async (url: string, data: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}${url}`, data, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API POST ${url} failed:`, error);
      throw error;
    }
  },
  put: async (url: string, data?: any) => {
    try {
      const response = await axios.put(`${API_BASE_URL}${url}`, data, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API PUT ${url} failed:`, error);
      throw error;
    }
  },
  delete: async (url: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}${url}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error(`API DELETE ${url} failed:`, error);
      throw error;
    }
  },
};
