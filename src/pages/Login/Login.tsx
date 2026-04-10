import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import Button from "@components/common/Button";
import Toast from "@components/common/Toast";
import Input from "@components/common/Input";
import "./Login.css";
import backgroundImage from "@/assets/background-login.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email, password });
      navigate("/");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Ocorreu um erro ao fazer login.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container-full">
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
      {/* Bloco da Esquerda */}
      <div className="login-left">
        <div className="login-left-content">
          <h1>
            Arquitetura
            <br />
            Logística Digital.
          </h1>
          <p className="login-left-subtitle">
            Projetando infraestrutura de dados para a próxima geração de cadeias
            de suprimentos globais. Simplicidade técnica, precisão absoluta.
          </p>
          <div className="login-image-wrapper">
            <img src={backgroundImage} alt="Background Koda" />
          </div>
        </div>
        <div className="login-left-footer">
          <span>© 2026 KODA LOGTECH</span>
        </div>
      </div>

      {/* Bloco da Direita */}
      <div className="login-right">
        <div className="login-right-content">
          <header className="login-right-header">
            <h2>Acessar Plataforma</h2>
            <p>Entre com suas credenciais para gerenciar ativos e fluxos.</p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="E-mail Corporativo"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@empresa.com"
              required
            />

            <Input
              label="Senha"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="***"
              required
              containerStyle={{ marginTop: '1.5rem' }}
            />

            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="large"
            >
              Entrar
            </Button>
          </form>

          <div className="login-access-request">
            <span>Ainda não possui acesso?</span>
            <button type="button" className="btn-outline">
              Solicitar Acesso
            </button>
          </div>

          <div className="login-warning-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="warning-icon"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>
              O acesso à plataforma KODA é restrito a parceiros homologados e
              colaboradores diretos. Para suporte técnico, entre em contato com
              o centro de arquitetura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
