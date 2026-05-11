export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Carga {
  id: number;
  tipo: string;
  temperatura_maxima: number;
  temperatura_minima: number;
  temperatura_atual: number;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface CentroLogistica {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  endereco?: string;
  telefone?: string;
  is_ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  latitude: number;
  longitude: number;
  endereco?: string;
  is_ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Armazem {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  endereco?: string;
  telefone?: string;
  email?: string;
  capacidade_kg?: number;
  is_ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Caminhao {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  capacidade_kg: number;
  id_usuario: number;
  id_carga?: number;
  id_centro_logistica?: number;
  status: 'disponivel' | 'em_rota' | 'manutencao' | 'inativo';
  created_at: string;
  updated_at: string;
}

/** Resposta de `GET /caminhoes/completo` e `GET /caminhoes/:id/completo` */
export interface CaminhaoCompleto extends Caminhao {
  nome_motorista: string | null;
  tipo_carga: string | null;
  nome_centro_logistica: string | null;
}

export interface Entrega {
  id: number;
  id_caminhao: number;
  id_cliente: number;
  id_armazem_parceiro?: number;
  status: 'pendente' | 'em_transito' | 'no_armazem' | 'entregue' | 'cancelada';
  data_saida?: string;
  data_previsao?: string;
  data_entrega?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

/** Resposta de `GET /entregas/completo` e `GET /entregas/:id/completo` */
export interface EntregaCompleta extends Entrega {
  placa_caminhao: string | null;
  modelo_caminhao?: string | null;
  nome_cliente: string | null;
  endereco_cliente: string | null;
  nome_motorista: string | null;
  motorista_avatar_url?: string | null;
  temperatura_atual: number | string | null;
  temperatura_maxima: number | string | null;
  temperatura_minima: number | string | null;
  latitude_carga?: number | string | null;
  longitude_carga?: number | string | null;
  latitude_cliente?: number | string | null;
  longitude_cliente?: number | string | null;
}

/** GeoJSON LineString — coordenadas em [longitude, latitude]. */
export interface LineStringGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

/** Resposta de `GET /entregas/:id/direction` */
export interface EntregaDirectionResponse {
  entrega_id: number;
  geometry: LineStringGeometry;
  duration_seconds: number;
  distance_meters: number;
}
