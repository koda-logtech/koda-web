import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Removido interceptor de request que injetava token manual,
// pois agora usamos cookies com withCredentials: true.

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Rota de refresh agora também usa cookies para enviar o refresh_token
        await axios.post(
          `${API_URL}/users/refresh`,
          {},
          {
            withCredentials: true,
          },
        );

        // Se o refresh deu certo, o cookie access_token foi atualizado no browser.
        // Podemos apenas repetir a requisição original.
        return api(originalRequest);
      } catch (refreshError) {
        // Se o refresh falhar, o cookie expirou.
        // O AuthContext cuidará de resetar o estado do usuário.
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
