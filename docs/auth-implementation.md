# Implementação de Autenticação JWT (Cookies HttpOnly)

Este documento detalha o funcionamento da camada de segurança do `koda-web`, baseada em tokens JWT armazenados em **Cookies HttpOnly**.

---

## 1. Visão Geral da Arquitetura
A autenticação do Koda migrou do armazenamento tradicional em `localStorage` para Cookies de servidor (**HttpOnly** e **SameSite=Strict/Lax**).

**Vantagens:**
- **Imunidade a XSS:** Scripts maliciosos executados no navegador não conseguem ler o token.
- **Gestão Automática:** O navegador envia os cookies automaticamente em cada requisição para o domínio do backend.
- **Menos Vazamento de Dados:** O frontend não precisa "tocar" no token para que ele funcione.

---

## 2. Configuração do Cliente API (Axios)
A peça central da integração está em `src/services/api.ts`. A propriedade `withCredentials: true` é o que permite o tráfego de cookies em requisições Cross-Origin (CORS).

```typescript
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Crucial para Cookies HttpOnly
});
```

### Mecanismo de Interceptação (Refresh Flow)
Implementamos um interceptor de resposta para lidar com a expiração de tokens:
1. **Captura de Erro 401:** Se uma requisição falha com 401, o token de acesso provavelmente expirou.
2. **Refresh Automático:** O Axios dispara uma chamada para `/users/refresh`. Como o `refresh_token` também é um cookie HttpOnly, ele é enviado automaticamente.
3. **Novos Cookies:** Se o refresh for bem-sucedido, o backend injeta novos cookies. O interceptor então repete a requisição original falha.
4. **Fallback de Logout:** Se o refresh falhar (refresh token expirado), o usuário é redirecionado para o login e o estado de autenticação é limpo.

---

## 3. Fluxo de Estado no Frontend (React Context)
O `AuthContext.tsx` gerencia o estado global de autenticação.

- **Inicialização:** No carregamento da aplicação, o contexto executa `GET /users/profile`. Se retornar sucesso, os dados do usuário são populados e ele é considerado autenticado.
- **Login:** O serviço de login do backend injeta os cookies e retorna os dados do usuário. O frontend apenas atualiza o estado interno com esses dados.
- **Logout:** Uma chamada para `POST /users/logout` é obrigatória para que o backend possa invalidar os cookies e limpar a sessão.

---

## 🛠 Guia de Troubleshooting para Desenvolvedores

1. **Tokens Invisíveis:** Não use `console.log(document.cookie)` (ele retornará vazio). Verifique a aba **Application -> Cookies** no DevTools do navegador.
2. **Erros de CORS:** Certifique-se que o `koda-server` possui a URL do frontend na lista de origens permitidas e que `credentials: true` está configurado no middleware de CORS do backend.
3. **Ambiente Local:** No `.env`, garanta que o `VITE_API_URL` aponta exatamente para o endereço onde o servidor está rodando (ex: `http://localhost:3000`).
4. **Expiração:** Para testar o refresh, você pode forçar a expiração do token no backend ou deletar manualmente o `access_token` nos Cookies do navegador e observar a tentativa de renovação.

---
*Segurança é um processo, não um produto. Siga sempre as diretrizes acima.*
