import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";
import Login from "@pages/Login/Login";
import Dashboard from "@pages/Dashboard/Dashboard";
import Header from "@components/Header";
import Footer from "@components/Footer";
import Button from "@components/Button";

function WelcomePage() {
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = (token: string) => {
    console.log("Login realizado com sucesso! Token:", token);
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<Login onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/"
          element={isLoggedIn ? <Dashboard /> : <WelcomePage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
