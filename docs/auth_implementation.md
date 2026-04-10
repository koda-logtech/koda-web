# Implementação de Autenticação JWT - Koda Web (Cookies HttpOnly)

Este documento descreve como a autenticação baseada em JWT e Cookies está integrada no frontend `koda-web`.

## 1. Visão Geral
A autenticação foi migrada de `localStorage` para **Cookies HttpOnly**, proporcionando maior segurança contra ataques XSS.
- O navegador gerencia automaticamente o armazenamento e envio dos tokens.
- O frontend não tem acesso direto aos tokens (por segurança), mas pode verificar o estado de autenticação através do carregamento inicial do perfil.

## 2. Configuração do Cliente API (`src/services/api.ts`)
O Axios está configurado com `withCredentials: true`. Isso é obrigatório para que o navegador inclua os cookies do backend em cada requisição Cross-Origin (CORS).

```typescript
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
```

### Fluxo de Erro 401 (Refresh Automático)
Quando o `access_token` expira, o interceptor de resposta captura o erro `401`.
- Ele dispara uma requisição para `/users/refresh` (também com `withCredentials: true`).
- Se a renovação for bem-sucedida (novos cookies setados), ele repete a requisição original.
- Se falhar (refresh expirado), o usuário é considerado deslogado.

## 3. Gerenciamento de Estado (`src/contexts/AuthContext.tsx`)
A fonte da verdade para o estado de autenticação é a resposta da rota `GET /users/profile`.
- **Carregamento Inicial**: No `useEffect` de inicialização, o `AuthContext` tenta carregar os dados do usuário. Se a chamada retornar `200`, o usuário está logado.
- **Login**: O serviço de login do backend agora retorna apenas os dados do usuário e uma mensagem, enquanto os tokens são injetados via cookies.

## 4. Remoção do `localStorage`
Toda a lógica de armazenamento manual de tokens no `localStorage` foi removida em favor da gestão automática do navegador. Arquivos de utilitários como `storage.ts` devem ser usados apenas para metadados não sensíveis (ex: preferências de tema ou flag de "lembrar e-mail").

---

## 🛠 Diretrizes para Desenvolvedores e Agentes

Ao trabalhar neste módulo, siga estas normas:

1. **CORS**: Se encontrar erros de CORS, certifique-se de que o backend está configurado com `credentials: true` e que a origem do frontend não é o curinga `*`.
2. **Ambiente**: O arquivo `.env` deve apontar para o `VITE_API_URL` correto (ex: `http://localhost:3000`).
3. **Debug de Tokens**: Como os cookies são `HttpOnly`, você não os verá em `console.log(document.cookie)`. Use a aba **Application -> Cookies** no Chrome DevTools para verificar se os tokens `access_token` e `refresh_token` estão presentes.
4. **Logout**: O logout deve sempre ser feito via requisição ao backend (`POST /users/logout`) para que o servidor possa limpar os cookies HttpOnly de forma eficaz.
