import { useTranslation } from "react-i18next";
import "./Footer.css";

export default function Footer() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Koda. {t("common.footer.rights")}</p>
        <div className="footer-links">
          <a href="/privacy">{t("common.footer.privacy")}</a>
          <a href="/terms">{t("common.footer.terms")}</a>
        </div>
      </div>
    </footer>
  );
}
