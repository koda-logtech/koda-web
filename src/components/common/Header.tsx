import { useTranslation } from "react-i18next";
import "./Header.css";

export default function Header() {
  const { t } = useTranslation('common');
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">Koda</h1>
        <nav className="nav">
          <a href="/">{t("common.header.home")}</a>
          <a href="/about">{t("common.header.about")}</a>
          <a href="/contact">{t("common.header.contact")}</a>
        </nav>
      </div>
    </header>
  );
}
