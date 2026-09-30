import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Toast from '@/components/common/Toast';
import { authService } from '@/services/auth';
import './ActivateAccount.css';

export default function ActivateAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t("auth.activate.invalidOrMissingToken", "Token de ativação inválido ou ausente."));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.activate.passwordMinLength", "A senha deve ter no mínimo 6 caracteres."));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.activate.passwordsDoNotMatch", "As senhas não coincidem."));
      return;
    }

    setIsLoading(true);
    try {
      await authService.activate(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        t("auth.activate.errorGeneric", "Não foi possível ativar sua conta. O link pode ter expirado."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="activate-account-container">
        <div className="activate-account-card">
          <div className="invalid-link-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>{t("auth.activate.invalidLinkTitle", "Link Inválido")}</h3>
            <p>{t("auth.activate.invalidLinkMessage", "O link de ativação informado é inválido ou está incompleto.")}</p>
            <Button variant="primary" onClick={() => navigate('/login')} size="large">
              {t("auth.activate.goToLogin", "Ir para o Login")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="activate-account-container">
        <div className="activate-account-card">
          <div className="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>{t("auth.activate.successTitle", "Conta Ativada com Sucesso!")}</h3>
            <p>{t("auth.activate.successMessage", "Sua senha foi definida. Você já pode fazer login na plataforma Koda.")}</p>
            <Button variant="primary" onClick={() => navigate('/login')} size="large">
              {t("auth.activate.goToLogin", "Ir para o Login")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activate-account-container">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      <div className="activate-account-card">
        <div className="activate-account-header">
          <h2>{t("auth.activate.title", "Ativar Conta")}</h2>
          <p>{t("auth.activate.subtitle", "Crie uma senha de acesso para começar a utilizar a plataforma.")}</p>
        </div>

        <form onSubmit={handleSubmit} className="activate-account-form">
          <Input
            label={t("auth.activate.passwordLabel", "Nova Senha")}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.activate.passwordPlaceholder", "Mínimo de 6 caracteres")}
            required
            autoComplete="new-password"
          />

          <Input
            label={t("auth.activate.confirmPasswordLabel", "Confirmar Senha")}
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("auth.activate.confirmPasswordPlaceholder", "Repita sua nova senha")}
            required
            autoComplete="new-password"
          />

          <div className="activate-account-footer">
            <button type="button" className="btn-back-link" onClick={() => navigate('/login')}>
              {t("auth.activate.backToLogin", "← Voltar ao Login")}
            </button>
            <Button type="submit" loading={isLoading} variant="primary">
              {t("auth.activate.submitButton", "Ativar e Salvar Senha")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
