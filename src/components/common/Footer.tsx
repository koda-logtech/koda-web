import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Koda. Todos os direitos reservados.</p>
        <div className="footer-links">
          <a href="/privacy">Privacidade</a>
          <a href="/terms">Termos</a>
        </div>
      </div>
    </footer>
  );
}
