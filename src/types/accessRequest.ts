export type AccessRequestStatus = 'pendente' | 'aprovado' | 'rejeitado';

export interface AccessRequest {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  cargo: string;
  descricao: string;
  status: AccessRequestStatus;
  createdAt: string;
}
