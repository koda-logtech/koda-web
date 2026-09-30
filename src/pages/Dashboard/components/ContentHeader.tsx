import { useTranslation } from "react-i18next";
import "./ContentHeader.css";

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function ContentHeader({ title, subtitle, actions }: ContentHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="content-header" aria-label={t("contentHeader.ariaLabel", "Cabeçalho de conteúdo")}>
      <div className="content-header-info">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="content-header-actions">{actions}</div>}
    </header>
  );
}
