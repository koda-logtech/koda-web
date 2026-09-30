import { useTranslation } from "react-i18next";

interface ErrorProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
}

export default function Error({ message, title, onRetry, retryText }: ErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="error-container" role="alert">
      <h2>{title || t("error.title", "Erro")}</h2>
      <p>{message || t("error.defaultMessage", "Ocorreu um erro inesperado.")}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          {retryText || t("error.retry", "Tentar Novamente")}
        </button>
      )}
    </div>
  );
}
