# Implementação de Autenticação JWT - Koda Web

Este documento descreve como a autenticação baseada em JWT está integrada no frontend `koda-web`, consumindo os serviços do `koda-server`.

## 1. Visão Geral
A autenticação utiliza dois tokens principais para manter a sessão segura e persistente:
- **Access Token**: Token de curta duração (15m), enviado em todas as requisições protegidas no cabeçalho `Authorization: Bearer <token>`.
- **Refresh Token**: Token de longa duração (7d), armazenado localmente para obter novos tokens de acesso quando estes expiram.

## 2. Estrutura de Dados e Tipagem (`src/types/auth.ts`)
A tipagem reflete exatamente o contrato do backend:
```typescript
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

## 3. Estratégia de Armazenamento (`src/utils/storage.ts`)
Os tokens são armazenados no `localStorage` com prefixo e chaves configuráveis via variáveis de ambiente:
- **Prefixo padrão**: `koda_`
- **Chaves**: `access_token` e `refresh_token`
- O utilitário `storage` centraliza a manipulação desses tokens.

## 4. Camada de Comunicação (`src/services/api.ts`)
O Axios está configurado com interceptores para automação do fluxo:
- **Interception de Requisição**: Injeta automaticamente o `accessToken` se disponível.
- **Interception de Resposta (401)**: Quando um erro 401 (Unauthorized) ocorre:
  1. O interceptor pausa a requisição original.
  2. Tenta renovar o token chamando a rota `/users/refresh`.
  3. Em caso de sucesso, atualiza o storage e repete a requisição original.
  4. Em caso de falha (refresh token expirado), limpa os tokens e encerra a sessão.

## 5. Gerenciamento de Estado (`src/contexts/AuthContext.tsx`)
O `AuthContext` é o "single source of truth" para a autenticação:
- **Estado**: `user`, `isAuthenticated` e `isLoading`.
- **Validação Inicial**: Ao carregar a aplicação, verifica se há tokens e tenta buscar o perfil do usuário (`/profile`).
- **Loading State**: O `isLoading` impede redirecionamentos indevidos enquanto a sessão inicial está sendo validada.

## 6. Proteção de Rotas (`src/components/common/ProtectedRoute.tsx`)
As rotas privadas são protegidas por um componente wrapper que verifica `isAuthenticated` e aguarda o fim do `isLoading`.

---

## 🛠 Diretrizes para Desenvolvedores e Agentes

Ao trabalhar neste módulo, siga rigorosamente estas normas:

1. **TypeScript**: Sempre use os tipos definidos em `src/types/auth.ts`.
2. **Segurança**:
   - Nunca logue tokens no console em produção.
   - O segredo JWT reside apenas no backend; o frontend apenas armazena e envia o token.
3. **Padrão de Código**:
   - Chamadas de API devem ser feitas via `authService` em `src/services/auth.ts`.
   - Lógica de estado global reside no `AuthContext`.
4. **Testes**:
   - **NÃO** espalhe arquivos `.test.ts` ou `.spec.ts` pela `src/`.
   - Utilize a pasta central de testes se houver uma, ou siga as instruções do projeto.
5. **Variáveis de Ambiente**:
   - Mantenha o `.env.example` atualizado com as configurações de storage e API.
