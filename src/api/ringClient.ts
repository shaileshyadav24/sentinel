import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const ringClient = axios.create();

ringClient.interceptors.request.use(async (config) => {
  const accessToken = await useAuthStore.getState().getValidAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

ringClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
