import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import DashboardOverview from "./components/DashboardOverview";
import Monitoring from "./components/Monitoring";
import Trips from "./components/Trips";
import Audit from "./components/Audit";
import Header from "@components/common/Header";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const handleLogoutClick = () => {
    handleLogout();
    navigate("/login");
  };

  const menuItems = ["Dashboard", "Monitoramento", "Viagens", "Auditoria"];

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <DashboardOverview />;
      case "Monitoramento":
        return <Monitoring />;
      case "Viagens":
        return <Trips />;
      case "Auditoria":
        return <Audit />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1 className="logo">Koda</h1>
          </div>
          <nav className="sidebar-menu">
            <ul>
              {menuItems.map((item) => (
                <li
                  key={item}
                  className={`sidebar-item ${activeTab === item ? "active" : ""}`}
                >
                  <button onClick={() => setActiveTab(item)}>{item}</button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-links">
              <a href="#suporte" className="sidebar-footer-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Suporte
              </a>
              <button
                onClick={handleLogoutClick}
                className="sidebar-footer-item btn-logout-link"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sair
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-body">
          <div className="dashboard-content">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
