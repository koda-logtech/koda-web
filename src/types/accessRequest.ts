export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AccessRequest {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  cargo: string;
  descricao: string;
  status: AccessRequestStatus;
  rejectionReason?: string;
  rejection_reason?: string;
  createdAt: string;
}
