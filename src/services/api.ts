import axios from "axios";

export const API_PREFIX = "/api";
// Em desenvolvimento local usa o .env (http://localhost:3005); em produção no container é relativo (/api)
const BASE_URL = window.__ENV__?.VITE_API_URL || import.meta.env.VITE_API_URL || "";
export const API_URL = `${BASE_URL}${API_PREFIX}`;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/** Rotas públicas onde 401 não significa “sessão expirada” — não chamar refresh. */
function isPublicAuthFailureRequest(config: { url?: string } | undefined): boolean {
  const url = config?.url ?? "";
  return (
    url.includes("/users/login") ||
    url.includes("/users/register") ||
    url.includes("/users/refresh") ||
    url.includes("/users/activate")
  );
}

// Removido interceptor de request que injetava token manual,
// pois agora usamos cookies com withCredentials: true.

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Login/registro com credenciais erradas também retornam 401; não tentar refresh
    // (sem cookies o backend responde "Token não fornecido" e mascara o erro real).
    if (
      error.response?.status === 401 &&
      originalRequest &&
      isPublicAuthFailureRequest(originalRequest)
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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
