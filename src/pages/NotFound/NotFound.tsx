import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import './NotFound.css';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>{t("notFound.title", "Página não encontrada")}</h2>
      <p>{t("notFound.description", "A página que você está procurando pode ter sido removida, teve seu nome alterado ou está temporariamente indisponível.")}</p>
      <Button variant="primary" onClick={() => navigate('/')}>
        {t("notFound.backToHome", "Voltar para a página inicial")}
      </Button>
    </div>
  );
}
