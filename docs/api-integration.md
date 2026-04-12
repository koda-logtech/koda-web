# Guia de Integração com API (CRUDs)

Este documento descreve os padrões de integração entre o frontend (`koda-web`) e o backend (`koda-server`), focando no gerenciamento das entidades do sistema de logística.

---

## 🏗 Arquitetura da Camada de Serviço

A integração segue o padrão de **Service Layer**, onde toda a comunicação externa é isolada do componente UI.

- **Configuração Global:** Localizada em `src/services/api.ts`. Utiliza o Axios com `withCredentials: true` para suporte a cookies HttpOnly.
- **Serviços Individuais:** Localizados em `src/services/*.service.ts`. Cada arquivo gerencia uma entidade (ex: `carga.service.ts`).

---

## 📊 Modelagem de Dados (TypeScript)

Os tipos principais estão centralizados em `src/types/models.ts` para garantir consistência entre serviços e componentes.

### Entidades Core:
- **Carga:** Identifica o tipo de carga e os limites térmicos aceitáveis.
- **Centro Logística:** Pontos de partida, chegada ou apoio geolocalizados.
- **Cliente:** Destinatários das entregas.
- **Armazém:** Pontos de transbordo e armazenamento temporário com controle de capacidade.
- **Caminhão:** Veículos da frota vinculados a um motorista e a um hardware de monitoramento.
- **Entrega:** Ordem de serviço que consolida caminhão, destino, status e datas operacionais.

---

## 🛠 Padrão de Serviço (Exemplo)

Cada serviço deve expor métodos padronizados seguindo a filosofia RESTful.

```typescript
// Exemplo: src/services/carga.service.ts
export const CargaService = {
  // Listagem com suporte a paginação
  async getAll(page = 1, limit = 10) {
    const response = await api.get(`/carga?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Busca por ID único
  async getById(id: string) {
    const response = await api.get(`/carga/${id}`);
    return response.data;
  },

  // Criação de nova carga
  async create(data: CargaInput) {
    return await api.post('/carga', data);
  },

  // Atualização (PATCH para campos específicos ou PUT para completo)
  async update(id: string, data: Partial<CargaInput>) {
    return await api.put(`/carga/${id}`, data);
  },

  // Remoção lógica ou física
  async delete(id: string) {
    return await api.delete(`/carga/${id}`);
  }
};
```

---

## 💻 Diretrizes para Interface (UI)

### Gerenciamento de Estado
- Utilize `useEffect` para carregar dados no montante do componente.
- Prefira estados locais (`useState`) para dados de formulários simples e contextos (`Context API`) para dados compartilhados globalmente.

### Tratamento de Erros e Feedback
- **Try/Catch:** Toda chamada de API no componente deve estar dentro de um bloco try/catch.
- **Toasts:** Utilize notificações visuais para informar o sucesso ou falha das operações de CRUD.
- **Loading States:** Implemente estados de carregamento (spinners ou esqueletos) para melhorar a experiência do usuário durante requisições assíncronas.

### Paginação e Filtros
- Mantenha os parâmetros de paginação e filtros no estado da URL (Query Params) quando possível, para permitir o compartilhamento de links e manter o estado ao recarregar a página.

---
*Este guia deve ser seguido ao implementar novas rotas ou entidades no sistema.*
