import { AccessRequest } from '@/types/accessRequest';
import { User } from '@/types/auth';

const mockAccessRequests: AccessRequest[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@exemplo.com',
    empresa: 'Logistica S.A.',
    cargo: 'Gerente de Operações',
    descricao: 'Preciso de acesso para gerenciar as frotas.',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    nome: 'Maria Souza',
    email: 'maria.souza@techlog.com',
    empresa: 'TechLog',
    cargo: 'Analista',
    descricao: 'Acesso para visualizar relatórios.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
];

// Mock do backend
export const accessRequestServiceMock = {
  getRequests: async (): Promise<AccessRequest[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockAccessRequests]), 500));
  },

  createRequest: async (data: Omit<AccessRequest, 'id' | 'status' | 'createdAt'>): Promise<AccessRequest> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRequest: AccessRequest = {
          ...data,
          id: Math.random().toString(36).substring(7),
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        mockAccessRequests.push(newRequest);
        resolve(newRequest);
      }, 500);
    });
  },

  approveRequest: async (id: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const request = mockAccessRequests.find(r => r.id === id);
        if (!request) return reject(new Error('Solicitação não encontrada'));

        request.status = 'approved';

        // Retorna um usuário mockado como se tivesse sido criado
        const newUser: User = {
          id: Math.floor(Math.random() * 1000),
          email: request.email,
          role: 'user'
        };
        resolve(newUser);
      }, 500);
    });
  },

  rejectRequest: async (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const request = mockAccessRequests.find(r => r.id === id);
        if (!request) return reject(new Error('Solicitação não encontrada'));

        request.status = 'rejected';
        resolve();
      }, 500);
    });
  }
};
