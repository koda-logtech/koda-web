# CRUD Integration Spec - Koda Web

## Objective
Integrate the backend CRUD endpoints into the frontend to allow management of the logistics system entities.

## 1. Data Models (Types)
Create `src/types/models.ts` with the following interfaces:

- **User**: id, name, email, phone, avatar_url, role, is_active, created_at, updated_at
- **Carga**: id, tipo, temperatura_maxima, temperatura_minima, temperatura_atual, latitude, longitude, created_at, updated_at
- **CentroLogistica**: id, nome, latitude, longitude, endereco, telefone, is_ativo, created_at, updated_at
- **Cliente**: id, nome, email, telefone, documento, latitude, longitude, endereco, is_ativo, created_at, updated_at
- **Armazem**: id, nome, latitude, longitude, endereco, telefone, email, capacidade_kg, is_ativo, created_at, updated_at
- **Caminhao**: id, placa, modelo, marca, ano, capacidade_kg, id_usuario, id_carga, id_centro_logistica, status, created_at, updated_at
- **Entrega**: id, id_caminhao, id_cliente, id_armazem_parceiro, status, data_saida, data_previsao, data_entrega, observacoes, created_at, updated_at

## 2. Services
Create service files in `src/services/` using the `api` instance from `api.ts`.
Each service should follow this pattern (example for `carga`):
- `getAll(page, limit)` -> `GET /carga?page=X&limit=Y`
- `getById(id)` -> `GET /carga/:id`
- `create(data)` -> `POST /carga`
- `update(id, data)` -> `PUT /carga/:id`
- `delete(id)` -> `DELETE /carga/:id`

Files to create:
- `carga.service.ts` (Endpoint: `/carga`)
- `centroLogistica.service.ts` (Endpoint: `/centros-logistica`)
- `cliente.service.ts` (Endpoint: `/clientes`)
- `armazem.service.ts` (Endpoint: `/armazens`)
- `caminhao.service.ts` (Endpoint: `/caminhoes`)
- `entrega.service.ts` (Endpoint: `/entregas`)

## 3. UI Integration (Dashboard)
Update the `Dashboard` component to include a new "Gerenciamento" tab or separate the existing ones to fetch real data.
- Implement a basic table/list view for at least one entity (e.g., `Caminhoes`) to demonstrate the integration.
- Use `useEffect` to fetch data on component mount.
