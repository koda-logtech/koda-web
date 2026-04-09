import { useState } from "react";
import Button from "@components/common/Button";
import "./DashboardOverview.css";

export default function DashboardOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  // Info dinâmica que poderá vir de um contexto ou API futuramente
  const [locationInfo] = useState("São Paulo, SP");

  return (
    <div className="dashboard-overview">
      {/* Header Específico da Seção */}
      <header className="section-header">
        <div className="header-left">
          <div className="search-bar">
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
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar veículo ou rota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          <button className="icon-btn" title="Histórico">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
          <button className="icon-btn" title="Notificações">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 01-3.46 0"></path></svg>
            <span className="notification-badge"></span>
          </button>
          <div className="user-profile">
            <img src="https://ui-avatars.com/api/?name=User&background=3498DB&color=fff" alt="User" />
          </div>
        </div>
      </header>

      {/* Títulos e Ações */}
      <div className="page-top-actions">
        <div className="title-group">
          <h1>Visão Geral da Operação</h1>
          <p className="subtitle">Monitoramento em tempo real • {locationInfo}</p>
        </div>
        <div className="button-group">
          <Button variant="secondary" size="medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exportar Relatórios
          </Button>
          <Button variant="primary" size="medium">+ Novo Manifesto</Button>
        </div>
      </div>

      {/* Grid de Métricas (Quadrados) */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="metric-icon"
            >
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            <span className="metric-label">EM TRÂNSITO</span>
          </div>
          <h2 className="metric-value">42</h2>
          <span className="metric-subtext">Veículos em rota ativa</span>
        </div>
        
        <div className="metric-card warning">
          <div className="metric-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="metric-icon"
            >
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
            </svg>
            <span className="metric-label">RISCO TÉRMICO</span>
          </div>
          <h2 className="metric-value">05</h2>
          <span className="metric-subtext">Acima do limiar de segurança</span>
        </div>

        <div className="metric-card danger">
          <div className="metric-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="metric-icon"
            >
              <path d="M12 20v-8"></path>
              <path d="M17 20V8"></path>
              <path d="M22 4v16"></path>
              <path d="M2 20h.01"></path>
              <path d="M7 20v-4"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span className="metric-label">DESCONECTADOS</span>
          </div>
          <h2 className="metric-value">02</h2>
          <span className="metric-subtext">Sensores sem sinal &gt; 15 min</span>
        </div>

        <div className="metric-card dark-theme">
          <div className="metric-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="metric-icon"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="metric-label">ALERTAS ATIVOS</span>
          </div>
          <h2 className="metric-value">12</h2>
          <span className="metric-subtext">Prioridade Alta (Nível 1)</span>
        </div>
      </div>

      <div className="main-overview-content">
        {/* Mapa à Esquerda */}
        <div className="map-section">
          <div className="map-placeholder">
            {/* Camadas no Canto Superior Esquerdo */}
            <button className="map-layers-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              Camadas de tráfego
            </button>

            {/* Zoom no Canto Inferior Direito */}
            <div className="map-zoom-controls">
              <button className="map-control-btn">+</button>
              <button className="map-control-btn">-</button>
            </div>

            {/* LIVE centralizado na parte inferior */}
            <div className="map-live-indicator">
              <span className="live-bullet"></span>
              <strong>LIVE:</strong> 42 veículos em operação
            </div>

            <div className="map-mock-bg">
              <div className="vehicle-marker pulse-active" style={{ top: '30%', left: '40%' }}></div>
              <div className="vehicle-marker pulse-warning" style={{ top: '55%', left: '60%' }}></div>
              <div className="vehicle-marker pulse-active" style={{ top: '20%', left: '75%' }}></div>
              <div className="vehicle-marker pulse-danger" style={{ top: '45%', left: '25%' }}></div>
              <div className="map-text">Interface de Mapa</div>
            </div>
          </div>
        </div>

        {/* Lista Live à Direita */}
        <div className="monitoring-sidebar">
          <div className="sidebar-header-live">
            <h3>Monitoramento Live</h3>
            <button className="filter-btn" title="Filtrar">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>
          
          <div className="live-cards-list">
            <div className="live-card">
              <div className="card-top">
                <span className="vehicle-id">KOD-2024 (Scania R500)</span>
                <span className="temp-info">2.4°C</span>
              </div>
              <p className="route-info">São Paulo, SP → Curitiba, PR</p>
            </div>

            <div className="live-card alert-border">
              <div className="card-top">
                <span className="vehicle-id">KOD-1105 (Volvo FH)</span>
                <span className="temp-info warning-text">-18.2°C</span>
              </div>
              <p className="route-info">Santos, SP → Rio de Janeiro, RJ</p>
            </div>

            <div className="live-card">
              <div className="card-top">
                <span className="vehicle-id">KOD-3342 (Mercedes Actros)</span>
                <span className="temp-info">4.1°C</span>
              </div>
              <p className="route-info">Campinas, SP → Belo Horizonte, MG</p>
            </div>

            <div className="live-card danger-border">
              <div className="card-top">
                <span className="vehicle-id">KOD-0021 (Iveco S-Way)</span>
                <span className="temp-info danger-text">8.5°C</span>
              </div>
              <p className="route-info">São Bernardo, SP → Porto Alegre, RS</p>
            </div>
          </div>

          <div className="sidebar-footer-action">
            <button className="view-all-btn">VER MANIFESTO COMPLETO</button>
          </div>
        </div>
      </div>
    </div>
  );
}
