import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">Koda</h1>
        <nav className="nav">
          <a href="/">Home</a>
          <a href="/about">Sobre</a>
          <a href="/contact">Contato</a>
        </nav>
      </div>
    </header>
  );
}
