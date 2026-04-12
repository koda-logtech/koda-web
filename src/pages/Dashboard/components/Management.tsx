import { useState } from "react";
import { useUsers, useDeleteUser } from "@controllers/userController";
import { useCaminhoes, useDeleteCaminhao } from "@controllers/caminhaoController";
import { useClientes, useDeleteCliente } from "@controllers/clienteController";
import { useArmazens, useDeleteArmazem } from "@controllers/armazemController";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import MotoristasView from "./MotoristasView";
import CaminhoesView from "./CaminhoesView";
import ClientesView from "./ClientesView";
import ArmazensView from "./ArmazensView";
import ConfirmModal from "@components/common/ConfirmModal";
import "./Management.css";

import { useToast } from "@/contexts/ToastContext";

type SubSection = "Motoristas" | "Caminhões" | "Clientes" | "Armazéns Parceiros";

export default function Management() {
  const [activeSubTab, setActiveSubTab] = useState<SubSection>("Motoristas");
  const [showFullMotoristas, setShowFullMotoristas] = useState(false);
  const [showFullCaminhoes, setShowFullCaminhoes] = useState(false);
  const [showFullClientes, setShowFullClientes] = useState(false);
  const [showFullArmazens, setShowFullArmazens] = useState(false);
  const { addToast } = useToast();

  // State for deletion
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<{ id: number; name: string } | null>(null);

  // Queries (enabled per active tab)
  const { data: motoristas = [], isLoading: loadingMotoristas } = useUsers(1, 0, { enabled: activeSubTab === "Motoristas" && showFullMotoristas });
  const { data: caminhoes = [], isLoading: loadingCaminhoes } = useCaminhoes(1, 0, { enabled: activeSubTab === "Caminhões" && showFullCaminhoes });
  const { data: clientes = [], isLoading: loadingClientes } = useClientes(1, 0, { enabled: activeSubTab === "Clientes" && showFullClientes });
  const { data: armazens = [], isLoading: loadingArmazens } = useArmazens(1, 0, { enabled: activeSubTab === "Armazéns Parceiros" && showFullArmazens });

  const loading = (activeSubTab === "Motoristas" && !showFullMotoristas) || 
                  (activeSubTab === "Caminhões" && !showFullCaminhoes) ||
                  (activeSubTab === "Clientes" && !showFullClientes) ||
                  (activeSubTab === "Armazéns Parceiros" && !showFullArmazens)
    ? false
    : (loadingMotoristas || loadingCaminhoes || loadingClientes || loadingArmazens);

  const deleteUser = useDeleteUser();
  const deleteCaminhao = useDeleteCaminhao();
  const deleteCliente = useDeleteCliente();
  const deleteArmazem = useDeleteArmazem();

  const handleDeleteClick = (id: number, name: string) => {
    setEntityToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const [searchTerm, setSearchTerm] = useState("");

  const confirmDelete = async () => {
    if (!entityToDelete) return;

    try {
      if (activeSubTab === "Motoristas") {
        await deleteUser.mutateAsync(entityToDelete.id);
      } else if (activeSubTab === "Caminhões") {
        await deleteCaminhao.mutateAsync(entityToDelete.id);
      } else if (activeSubTab === "Clientes") {
        await deleteCliente.mutateAsync(entityToDelete.id);
      } else if (activeSubTab === "Armazéns Parceiros") {
        await deleteArmazem.mutateAsync(entityToDelete.id);
      }

      addToast({ message: "Excluído com sucesso!", type: "success" });
      setIsDeleteModalOpen(false);
      setEntityToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar entidade:", error);
      addToast({ message: "Erro ao excluir. Tente novamente.", type: "error" });
    }
  };

  const renderTable = () => {
    if (loading && 
        activeSubTab !== "Motoristas" && 
        activeSubTab !== "Caminhões" && 
        activeSubTab !== "Clientes" &&
        activeSubTab !== "Armazéns Parceiros") {
      return <Loading message={`Carregando ${activeSubTab}...`} />;
    }

    const filteredData = (data: any[], key: string) => {
      if (!searchTerm) return data;
      return data.filter(item => 
        item[key]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    switch (activeSubTab) {
      case "Motoristas":
        if (!showFullMotoristas) {
          return <MotoristasView onViewAll={() => setShowFullMotoristas(true)} />;
        }
        const filteredMotoristas = filteredData(motoristas, "name");
        return (
          <div className="table-container">
            <div className="table-header-modern">
              <div className="table-header-left">
                <Button variant="primary" size="small" onClick={() => { setShowFullMotoristas(false); setSearchTerm(""); }}>
                  ← Voltar
                </Button>
                <h3 className="table-title">Listagem de Motoristas</h3>
              </div>
              <div className="table-search-wrapper">
                <svg className="search-icon-fixed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome..." 
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Motorista</th>
                  <th>Contato</th>
                  <th>Cargo / Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMotoristas.map((m: any) => (
                  <tr key={m.id}>
                    <td>
                      <span className="cell-main-text">{m.name}</span>
                      <span className="cell-sub-text">ID: #{m.id}</span>
                    </td>
                    <td>
                      <span className="cell-main-text">{m.email}</span>
                      <span className="cell-sub-text">{m.phone || "Sem telefone"}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="cell-main-text" style={{ fontSize: '0.85rem' }}>{m.role}</span>
                        <span className={`status-badge ${m.is_active ? "active" : "inactive"}`}>
                          {m.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon-action" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          className="btn-icon-action danger" 
                          title="Excluir"
                          onClick={() => handleDeleteClick(m.id, m.name)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMotoristas.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: '3rem', color: '#999' }}>Nenhum motorista encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "Caminhões":
        if (!showFullCaminhoes) {
          return <CaminhoesView onViewAll={() => setShowFullCaminhoes(true)} />;
        }
        const filteredCaminhoes = filteredData(caminhoes, "placa");
        return (
          <div className="table-container">
            <div className="table-header-modern">
              <div className="table-header-left">
                <Button variant="primary" size="small" onClick={() => { setShowFullCaminhoes(false); setSearchTerm(""); }}>
                                  ← Voltar
                                </Button>
                <h3 className="table-title">Gestão de Frota</h3>
              </div>
              <div className="table-search-wrapper">
                <svg className="search-icon-fixed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar por placa..." 
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Especificações</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCaminhoes.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <span className="cell-main-text">{c.placa}</span>
                      <span className="cell-sub-text">{c.modelo}</span>
                    </td>
                    <td>
                      <span className="cell-main-text">{c.marca}</span>
                      <span className="cell-sub-text">Ano: {c.ano}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${c.status}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon-action" title="Histórico">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </button>
                        <button 
                          className="btn-icon-action danger" 
                          title="Excluir"
                          onClick={() => handleDeleteClick(c.id, c.placa)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCaminhoes.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: '3rem', color: '#999' }}>Nenhum caminhão encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "Clientes":
        if (!showFullClientes) {
          return <ClientesView onViewAll={() => setShowFullClientes(true)} />;
        }
        const filteredClientes = filteredData(clientes, "nome");
        return (
          <div className="table-container">
            <div className="table-header-modern">
              <div className="table-header-left">
                <Button variant="primary" size="small" onClick={() => { setShowFullClientes(false); setSearchTerm(""); }}>
                  ← Voltar
                </Button>
                <h3 className="table-title">Base de Clientes</h3>
              </div>
              <div className="table-search-wrapper">
                <svg className="search-icon-fixed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome..." 
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato / Documento</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cl: any) => (
                  <tr key={cl.id}>
                    <td>
                      <span className="cell-main-text">{cl.nome}</span>
                      <span className="cell-sub-text">{cl.endereco || "Endereço não informado"}</span>
                    </td>
                    <td>
                      <span className="cell-main-text">{cl.email || "Sem email"}</span>
                      <span className="cell-sub-text">DOC: {cl.documento || "-"}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${cl.is_ativo ? "active" : "inactive"}`}>
                        {cl.is_ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon-action" title="Mapa">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </button>
                        <button 
                          className="btn-icon-action danger" 
                          title="Excluir"
                          onClick={() => handleDeleteClick(cl.id, cl.nome)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredClientes.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: '3rem', color: '#999' }}>Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "Armazéns Parceiros":
        if (!showFullArmazens) {
          return <ArmazensView onViewAll={() => setShowFullArmazens(true)} />;
        }
        const filteredArmazens = filteredData(armazens, "nome");
        return (
          <div className="table-container">
            <div className="table-header-modern">
              <div className="table-header-left">
                <Button variant="primary" size="small" onClick={() => { setShowFullArmazens(false); setSearchTerm(""); }}>
                  ← Voltar
                </Button>
                <h3 className="table-title">Rede de Armazéns</h3>
              </div>
              <div className="table-search-wrapper">
                <svg className="search-icon-fixed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome..." 
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th>Contato / Capacidade</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredArmazens.map((a: any) => (
                  <tr key={a.id}>
                    <td>
                      <span className="cell-main-text">{a.nome}</span>
                      <span className="cell-sub-text">{a.endereco || "Localização não definida"}</span>
                    </td>
                    <td>
                      <span className="cell-main-text">{a.email || a.telefone || "Sem contato"}</span>
                      <span className="cell-sub-text">Capacidade: {a.capacidade_kg}kg</span>
                    </td>
                    <td>
                      <span className={`status-badge ${a.is_ativo ? "active" : "inactive"}`}>
                        {a.is_ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon-action" title="Detalhes">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button 
                          className="btn-icon-action danger" 
                          title="Excluir"
                          onClick={() => handleDeleteClick(a.id, a.nome)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredArmazens.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: '3rem', color: '#999' }}>Nenhum armazém encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-page management-container">
      {/* Header unificado com Tabs e Ícones */}
      <header className="section-header" style={{ marginBottom: '2rem' }}>
        <div className="header-left">
          <div className="management-tabs" style={{ margin: 0, border: 'none', padding: 0 }}>
            {(["Motoristas", "Caminhões", "Clientes", "Armazéns Parceiros"] as SubSection[]).map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeSubTab === tab ? "active" : ""}`}
                onClick={() => {
                  setActiveSubTab(tab);
                  if (tab !== "Motoristas") setShowFullMotoristas(false);
                  if (tab !== "Caminhões") setShowFullCaminhoes(false);
                  if (tab !== "Clientes") setShowFullClientes(false);
                  if (tab !== "Armazéns Parceiros") setShowFullArmazens(false);
                }}
              >
                {tab}
              </button>
            ))}
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

      <div className="page-content">
        {renderTable()}
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir "${entityToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
