import { useState, useCallback } from 'react';
import { AccessRequest } from '@/types/accessRequest';
import { accessRequestServiceMock } from '@/services/mocks/accessRequestsMock';
import { User } from '@/types/auth';

// TODO: Implementar integração real com a API para solicitações de acesso
export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Substituir por chamada real da API
      const data = await accessRequestServiceMock.getRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar solicitações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRequest = async (data: Omit<AccessRequest, 'id' | 'status' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Substituir por chamada real da API
      const newRequest = await accessRequestServiceMock.createRequest(data);
      setRequests(prev => [...prev, newRequest]);
      return newRequest;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar solicitação');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequest = async (id: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Substituir por chamada real da API
      const newUser = await accessRequestServiceMock.approveRequest(id);
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'aprovado' } : req));
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar solicitação');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRequest = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Substituir por chamada real da API
      await accessRequestServiceMock.rejectRequest(id);
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejeitado' } : req));
    } catch (err: any) {
      setError(err.message || 'Erro ao rejeitar solicitação');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requests,
    isLoading,
    error,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest
  };
}
