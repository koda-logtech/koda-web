import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import Header from "@components/Header";
import Button from "@components/Button";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  const handleLogoutClick = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      <Header />

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-menu">
            <ul>
              <li className="sidebar-item active">
                <a href="#dashboard">Dashboard</a>
              </li>
              <li className="sidebar-item">
                <a href="#monitoramento">Monitoramento</a>
              </li>
              <li className="sidebar-item">
                <a href="#viagens">Viagens</a>
              </li>
              <li className="sidebar-item">
                <a href="#auditoria">Auditoria</a>
              </li>
            </ul>
          </nav>

          <div className="sidebar-footer">
            <Button onClick={handleLogoutClick} variant="danger" size="small">
              Sair
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-body">
          <div className="dashboard-content">
            <h1>Bem-vindo ao Dashboard!</h1>
            <p>Você está logado no sistema.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
