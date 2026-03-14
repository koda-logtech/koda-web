import { useState } from "react";
import "./App.css";
import Header from "@components/Header";
import Footer from "@components/Footer";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <section className="container">
          <h1>Bem-vindo ao Koda Web</h1>
          <p>Estrutura React + TypeScript</p>

          <div className="demo-section">
            <button onClick={() => setCount((count) => count + 1)}>
              Contador: {count}
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default App;
