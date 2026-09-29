import { useTranslation } from "react-i18next";

interface LoadingProps {
  message?: string;
}

export default function Loading({ message }: LoadingProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t("loading.message", "Carregando...");

  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="spinner"></div>
      <p>{displayMessage}</p>
    </div>
  );
}
