import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { useTheme } from "@hooks/useTheme";
import DashboardOverview from "./components/DashboardOverview";
import Monitoring from "./components/Monitoring";
import Trips from "./components/Trips";
import Cargas from "./components/Cargas";
import Audit from "./components/Audit";
import Alertas from "./components/Alertas";
import Management from "./components/Management";
import NotificationBell from "@components/common/NotificationBell";
import NewAlertModal from "@components/common/NewAlertModal";
import { AlertasNotificationProvider } from "@/contexts/AlertasNotificationContext";
import "./Dashboard.css";

type ActiveTab =
  | "Dashboard"
  | "Monitoramento"
  | "Cargas"
  | "Viagens"
  | "Gerenciamento"
  | "Alertas"
  | "Auditoria";

function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>("Dashboard");
  const [operationsOpen, setOperationsOpen] = useState(false);

  const isOperationsActive = activeTab === "Cargas" || activeTab === "Viagens";

  const selectOperation = (tab: "Cargas" | "Viagens") => {
    setActiveTab(tab);
    setOperationsOpen(true);
  };

  const toggleOperations = () => {
    setOperationsOpen((open) => !open);
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: (
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      ),
    },
    {
      name: "Monitoramento",
      icon: (
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
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
    },
    {
      name: "Gerenciamento",
      icon: (
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
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
          <path d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0 -6 0" />
          <path d="M12 7l0 2" />
          <path d="M12 15l0 2" />
          <path d="M17 12l-2 0" />
          <path d="M7 12l2 0" />
        </svg>
      ),
    },
    {
      name: "Alertas",
      icon: (
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
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
    },
    {
      name: "Auditoria",
      icon: (
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
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
      ),
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <DashboardOverview />;
      case "Monitoramento":
        return <Monitoring />;
      case "Cargas":
        return <Cargas />;
      case "Viagens":
        return <Trips />;
      case "Gerenciamento":
        return <Management />;
      case "Alertas":
        return <Alertas />;
      case "Auditoria":
        return <Audit />;
      default:
        return <DashboardOverview />;
    }
  };

  const operationsIcon = (
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
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );

  const cargasMenuIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="sidebar-subicon"
      aria-hidden
    >
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" rx="1" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );

  const viagensMenuIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="sidebar-subicon"
      aria-hidden
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );

  const goToAlertas = () => setActiveTab("Alertas");

  return (
    <AlertasNotificationProvider>
    <div className="dashboard-layout">
      <NotificationBell onOpenAlertasPage={goToAlertas} />
      <NewAlertModal onOpenAlertasPage={goToAlertas} />
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1 className="logo">Koda</h1>
          </div>
          <nav className="sidebar-menu">
            <ul>
              {menuItems.slice(0, 2).map((item) => (
                <li
                  key={item.name}
                  className={`sidebar-item ${activeTab === item.name ? "active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(item.name as ActiveTab);
                    }}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}

              <li
                className={`sidebar-group ${operationsOpen ? "is-open" : ""} ${isOperationsActive ? "has-active-child" : ""}`}
              >
                <button
                  type="button"
                  className="sidebar-group-toggle"
                  onClick={toggleOperations}
                  aria-expanded={operationsOpen}
                >
                  <span className="sidebar-group-toggle-left">
                    {operationsIcon}
                    <span>Operações</span>
                  </span>
                  <svg
                    className="sidebar-chevron"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {operationsOpen && (
                  <ul className="sidebar-subnav">
                    <li
                      className={`sidebar-item sidebar-subitem ${activeTab === "Cargas" ? "active" : ""}`}
                    >
                      <button type="button" onClick={() => selectOperation("Cargas")}>
                        {cargasMenuIcon}
                        <span>Cargas</span>
                      </button>
                    </li>
                    <li
                      className={`sidebar-item sidebar-subitem ${activeTab === "Viagens" ? "active" : ""}`}
                    >
                      <button type="button" onClick={() => selectOperation("Viagens")}>
                        {viagensMenuIcon}
                        <span>Viagens</span>
                      </button>
                    </li>
                    {user?.role === 'admin' && (
                <li className="sidebar-item">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/acessos')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Acessos Admin</span>
                  </button>
                </li>
              )}
            </ul>
                )}
              </li>

              {menuItems.slice(2).map((item) => (
                <li
                  key={item.name}
                  className={`sidebar-item ${activeTab === item.name ? "active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.name as ActiveTab)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
              {user?.role === 'admin' && (
                <li className="sidebar-item">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/acessos')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Acessos Admin</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-links">
              <button onClick={toggleTheme} className="sidebar-footer-item theme-toggle">
                {theme === "light" ? (
                  <>
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
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    Modo Escuro
                  </>
                ) : (
                  <>
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
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    Modo Claro
                  </>
                )}
              </button>
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
    </AlertasNotificationProvider>
  );
}

export default Dashboard;
