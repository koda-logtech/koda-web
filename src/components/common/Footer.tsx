import { useTranslation } from "react-i18next";
import "./Footer.css";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Koda. {t("footer.rights", "Todos os direitos reservados.")}</p>
        <div className="footer-links">
          <a href="/privacy">{t("footer.privacy", "Privacidade")}</a>
          <a href="/terms">{t("footer.terms", "Termos")}</a>
        </div>
      </div>
    </footer>
  );
}
