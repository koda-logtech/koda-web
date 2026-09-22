import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Página não encontrada</h2>
      <p>A página que você está procurando pode ter sido removida, teve seu nome alterado ou está temporariamente indisponível.</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        Voltar para a página inicial
      </Button>
    </div>
  );
}
