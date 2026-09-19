import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import Toast from '@components/common/Toast';
import { useAccessRequests } from '@/hooks/api/useAccessRequests';
import './RequestAccess.css';

export default function RequestAccess() {
  const navigate = useNavigate();
  const { createRequest, isLoading } = useAccessRequests();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    empresa: '',
    cargo: '',
    descricao: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createRequest(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar a solicitação.');
    }
  };

  if (success) {
    return (
      <div className="request-access-container">
        <div className="request-access-card">
          <div className="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>Solicitação Enviada!</h3>
            <p>Sua solicitação de acesso foi recebida com sucesso. Nossa equipe analisará e entrará em contato em breve.</p>
            <Button variant="primary" onClick={() => navigate('/login')} size="large">
              Voltar para o Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-access-container">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      <div className="request-access-card">
        <div className="request-access-header">
          <h2>Solicitar Acesso</h2>
          <p>Preencha os dados abaixo para solicitar acesso à plataforma Koda.</p>
        </div>

        <form onSubmit={handleSubmit} className="request-access-form">
          <Input
            label="Nome Completo"
            id="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Seu nome"
            required
          />

          <Input
            label="E-mail Corporativo"
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="exemplo@empresa.com"
            required
          />

          <Input
            label="Empresa"
            id="empresa"
            value={formData.empresa}
            onChange={handleChange}
            placeholder="Nome da sua empresa"
            required
          />

          <Input
            label="Cargo"
            id="cargo"
            value={formData.cargo}
            onChange={handleChange}
            placeholder="Seu cargo atual"
            required
          />

          <div className="request-access-form-group">
            <label htmlFor="descricao">Motivo da Solicitação</label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Descreva brevemente por que você precisa de acesso..."
              required
            />
          </div>

          <div className="request-access-footer">
            <button type="button" className="btn-back-link" onClick={() => navigate('/login')}>
              ← Voltar
            </button>
            <Button type="submit" loading={isLoading} variant="primary">
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
