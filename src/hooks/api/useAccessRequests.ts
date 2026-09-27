import { useState, useCallback } from 'react';
import { AccessRequest } from '@/types/accessRequest';
import { accessRequestService } from '@/services/accessRequestService';
import { User } from '@/types/auth';

export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setIsFetching(true);
    setError(null);
    try {
      const data = await accessRequestService.getRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao buscar solicitações');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  const createRequest = async (data: Omit<AccessRequest, 'id' | 'status' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newRequest = await accessRequestService.createRequest(data);
      setRequests(prev => [...prev, newRequest]);
      return newRequest;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erro ao criar solicitação';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequest = async (id: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await accessRequestService.approveRequest(id);
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
      return newUser;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erro ao aprovar solicitação';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRequest = async (id: string, options?: { reason?: string; notify?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await accessRequestService.rejectRequest(id, options);
      setRequests(prev => prev.map(req => req.id === id ? {
        ...req,
        status: 'rejected',
        rejectionReason: options?.reason || updated?.rejectionReason || req.rejectionReason,
        rejection_reason: options?.reason || updated?.rejection_reason || req.rejection_reason,
      } : req));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erro ao rejeitar solicitação';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requests,
    isLoading,
    isFetching,
    error,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest
  };
}
