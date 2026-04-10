import { useState } from "react";
import { useUsers, useDeleteUser } from "@controllers/userController";
import { useCaminhoes } from "@controllers/caminhaoController";
import { useClientes } from "@controllers/clienteController";
import { useArmazens } from "@controllers/armazemController";

import ContentHeader from "./ContentHeader";
import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import MotoristasView from "./MotoristasView";
import ConfirmModal from "@components/common/ConfirmModal";
import "./Management.css";

type SubSection = "Motoristas" | "Caminhões" | "Clientes" | "Armazéns Parceiros";

export default function Management() {
  const [activeSubTab, setActiveSubTab] = useState<SubSection>("Motoristas");
  const [showFullMotoristas, setShowFullMotoristas] = useState(false);

  // State for deletion
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<{ id: number; name: string } | null>(null);

  // Queries (enabled per active tab)
  const { data: motoristas = [], isLoading: loadingMotoristas } = useUsers(1, 0, { enabled: activeSubTab === "Motoristas" && showFullMotoristas });
  const { data: caminhoes = [], isLoading: loadingCaminhoes } = useCaminhoes({ enabled: activeSubTab === "Caminhões" });
  const { data: clientes = [], isLoading: loadingClientes } = useClientes({ enabled: activeSubTab === "Clientes" });
  const { data: armazens = [], isLoading: loadingArmazens } = useArmazens({ enabled: activeSubTab === "Armazéns Parceiros" });

  const loading = (activeSubTab === "Motoristas" && !showFullMotoristas)
    ? false
    : (loadingMotoristas || loadingCaminhoes || loadingClientes || loadingArmazens);

  const deleteUser = useDeleteUser();

  const handleDeleteClick = (id: number, name: string) => {
    setEntityToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!entityToDelete) return;

    try {
      if (activeSubTab === "Motoristas") {
        await deleteUser.mutateAsync(entityToDelete.id);
      }

      setIsDeleteModalOpen(false);
      setEntityToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar entidade:", error);
      alert("Erro ao excluir. Tente novamente.");
    }
  };

  const renderTable = () => {
    if (loading && activeSubTab !== "Motoristas") return <Loading message={`Carregando ${activeSubTab}...`} />;

    switch (activeSubTab) {
      case "Motoristas":
        if (!showFullMotoristas) {
          return <MotoristasView onViewAll={() => setShowFullMotoristas(true)} />;
        }
        return (
          <div className="table-container">
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="small" onClick={() => setShowFullMotoristas(false)}>
                ← Voltar para Cadastro
              </Button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {motoristas.map((m: any) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.phone || "-"}</td>
                    <td>{m.role}</td>
                    <td>
                      <span className={`status-badge ${m.is_active ? "active" : "inactive"}`}>
                        {m.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-icon-danger" 
                          title="Excluir"
                          onClick={() => handleDeleteClick(m.id, m.name)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {motoristas.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>Nenhum motorista encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "Caminhões":
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>Marca</th>
                  <th>Ano</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {caminhoes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.placa}</td>
                    <td>{c.modelo}</td>
                    <td>{c.marca}</td>
                    <td>{c.ano}</td>
                    <td>
                      <span className={`status-badge ${c.status}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
                {caminhoes.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>Nenhum caminhão encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "Clientes":
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Documento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cl) => (
                  <tr key={cl.id}>
                    <td>{cl.nome}</td>
                    <td>{cl.email || "-"}</td>
                    <td>{cl.telefone || "-"}</td>
                    <td>{cl.documento || "-"}</td>
                    <td>
                      <span className={`status-badge ${cl.is_ativo ? "active" : "inactive"}`}>
                        {cl.is_ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "Armazéns Parceiros":
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Email</th>
                  <th>Capacidade (kg)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {armazens.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nome}</td>
                    <td>{a.telefone || "-"}</td>
                    <td>{a.email || "-"}</td>
                    <td>{a.capacidade_kg || "-"}</td>
                    <td>
                      <span className={`status-badge ${a.is_ativo ? "active" : "inactive"}`}>
                        {a.is_ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
                {armazens.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>Nenhum armazém encontrado.</td>
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
      <ContentHeader 
        title="Gerenciamento" 
        subtitle="Administração centralizada de entidades do sistema."
      />

      <div className="management-tabs">
        {(["Motoristas", "Caminhões", "Clientes", "Armazéns Parceiros"] as SubSection[]).map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeSubTab === tab ? "active" : ""}`}
            onClick={() => {
              setActiveSubTab(tab);
              if (tab !== "Motoristas") setShowFullMotoristas(false);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        {renderTable()}
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o motorista "${entityToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
