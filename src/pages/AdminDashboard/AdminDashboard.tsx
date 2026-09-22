import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessRequests } from '@/hooks/api/useAccessRequests';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { requests, isLoading, error, fetchRequests, approveRequest, rejectRequest } = useAccessRequests();

  const [activeTab, setActiveTab] = useState<'solicitacoes' | 'usuarios'>('solicitacoes');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id);
      setToastMessage({ text: 'Solicitação aprovada e usuário criado com sucesso.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Erro ao aprovar solicitação.', type: 'error' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(id);
      setToastMessage({ text: 'Solicitação rejeitada.', type: 'success' });
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Erro ao rejeitar solicitação.', type: 'error' });
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
        <Button variant="secondary" onClick={() => navigate('/')}>
          Voltar ao Dashboard Principal
        </Button>
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
                            <Button size="small" variant="primary" onClick={() => handleApprove(req.id)}>
                              Aprovar
                            </Button>
                            <Button size="small" variant="danger" onClick={() => handleReject(req.id)}>
                              Rejeitar
                            </Button>
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
    </div>
  );
}
