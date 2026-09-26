import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessRequests } from '@/hooks/api/useAccessRequests';
import { AccessRequest } from '@/types/accessRequest';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';
import RejectRequestModal from './components/RejectRequestModal';
import ReasonDetailsModal from './components/ReasonDetailsModal';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { requests, isLoading, isFetching, error, fetchRequests, approveRequest, rejectRequest } = useAccessRequests();

  const [activeTab, setActiveTab] = useState<'solicitacoes' | 'usuarios'>('solicitacoes');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [processingAction, setProcessingAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [rejectModalRequest, setRejectModalRequest] = useState<AccessRequest | null>(null);
  const [reasonDetailsRequest, setReasonDetailsRequest] = useState<AccessRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    setProcessingAction({ id, action: 'approve' });
    try {
      await approveRequest(id);
      setToastMessage({ text: 'Solicitação aprovada e usuário criado com sucesso.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Erro ao aprovar solicitação.', type: 'error' });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleConfirmReject = async (reason: string, notify: boolean) => {
    if (!rejectModalRequest) return;
    const { id } = rejectModalRequest;
    setProcessingAction({ id, action: 'reject' });
    try {
      await rejectRequest(id, { reason, notify });
      setToastMessage({ text: 'Solicitação rejeitada com sucesso.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Erro ao rejeitar solicitação.', type: 'error' });
      throw err;
    } finally {
      setProcessingAction(null);
    }
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="admin-dashboard-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loading />
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      {error && <Toast message={error} type="error" onClose={() => {}} />}

      <header className="admin-header">
        <h1>Painel Administrativo</h1>
        <div className="admin-header-actions">
          <Button
            variant="secondary"
            onClick={fetchRequests}
            loading={isFetching}
            loadingText="Atualizando..."
            disabled={processingAction !== null}
          >
            <span className="btn-refresh-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Atualizar
            </span>
          </Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Voltar ao Dashboard Principal
          </Button>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'solicitacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('solicitacoes')}
          >
            Solicitações de Acesso
          </button>
          <button
            className={`admin-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
          >
            Gerenciar Usuários
          </button>
        </div>

        <div className="admin-pane">
          {activeTab === 'solicitacoes' && (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Empresa</th>
                    <th>Cargo</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.nome}</td>
                      <td>{req.email}</td>
                      <td>{req.empresa}</td>
                      <td>{req.cargo}</td>
                      <td>
                        <span className={`badge-status ${req.status}`}>
                          {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : req.status === 'rejected' ? 'Rejeitado' : req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' && (
                          <div className="admin-actions">
                            <Button
                              size="small"
                              variant="primary"
                              loading={processingAction?.id === req.id && processingAction?.action === 'approve'}
                              loadingText="Aprovando..."
                              disabled={processingAction !== null || isFetching}
                              onClick={() => handleApprove(req.id)}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="small"
                              variant="danger"
                              loading={processingAction?.id === req.id && processingAction?.action === 'reject'}
                              loadingText="Rejeitando..."
                              disabled={processingAction !== null || isFetching}
                              onClick={() => setRejectModalRequest(req)}
                            >
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {req.status === 'rejected' && (
                          <div className="admin-actions">
                            {(req.rejectionReason || req.rejection_reason) && (
                              <button
                                type="button"
                                className="btn-view-reason"
                                title="Visualizar motivo da recusa"
                                onClick={() => setReasonDetailsRequest(req)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                Ver motivo
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        Nenhuma solicitação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div className="empty-state">
              <p>Módulo de gerenciamento de usuários em desenvolvimento.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Aqui você poderá visualizar, bloquear e criar acessos manualmente.
              </p>
            </div>
          )}
        </div>
      </main>

      <RejectRequestModal
        isOpen={Boolean(rejectModalRequest)}
        request={rejectModalRequest}
        onClose={() => setRejectModalRequest(null)}
        onConfirm={handleConfirmReject}
      />

      <ReasonDetailsModal
        isOpen={Boolean(reasonDetailsRequest)}
        request={reasonDetailsRequest}
        onClose={() => setReasonDetailsRequest(null)}
      />
    </div>
  );
}
