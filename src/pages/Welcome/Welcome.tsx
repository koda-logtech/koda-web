import { useNavigate } from "react-router-dom";
import Button from "@components/common/Button";
import Header from "@components/common/Header";
import Footer from "@components/common/Footer";
import "./Welcome.css";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <section className="container">
          <div className="welcome-content">
            <h1>Bem-vindo ao Koda Web</h1>
            <p>Estrutura React + TypeScript</p>

            <div className="demo-section">
              <Button onClick={() => navigate("/login")} variant="primary">
                Ir para Login
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
