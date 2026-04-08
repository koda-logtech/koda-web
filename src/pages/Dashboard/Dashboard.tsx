import { useNavigate } from "react-router-dom";
import Header from "@components/Header";
import Footer from "@components/Footer";
import Button from "@components/Button";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <section className="container">
          <div className="logged-in-content">
            <h1>Bem-vindo ao Dashboard!</h1>
            <p>Você está logado no sistema.</p>
            <Button onClick={handleLogout} variant="danger">
              Sair
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
