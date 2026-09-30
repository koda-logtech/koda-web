import { useTranslation } from "react-i18next";
import "./Header.css";

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">Koda</h1>
        <nav className="nav">
          <a href="/">{t("header.home", "Home")}</a>
          <a href="/about">{t("header.about", "Sobre")}</a>
          <a href="/contact">{t("header.contact", "Contato")}</a>
        </nav>
      </div>
    </header>
  );
}
