import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCaminhoes, useCreateCaminhao } from "@controllers/caminhaoController";
import { useCentrosLogistica } from "@controllers/centroLogisticaController";
import { useUsers } from "@controllers/userController";
import { useToast } from "@/contexts/ToastContext";
import type { User, CaminhaoCompleto, CentroLogistica } from "@/types/models";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import Input from "@components/common/Input";
import Select from "@components/common/Select";

function labelTipoCarga(tipo: string | null | undefined): string {
  return tipo != null && String(tipo).trim() !== "" ? tipo : "Sem carga vinculada";
}

function labelCentro(nome: string | null | undefined): string {
  return nome != null && String(nome).trim() !== "" ? nome : "—";
}

function labelMotorista(nome: string | null | undefined): string {
  return nome != null && String(nome).trim() !== "" ? nome : "—";
}

interface CaminhoesViewProps {
  onViewAll: () => void;
}

export default function CaminhoesView({ onViewAll }: CaminhoesViewProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    placa: "",
    modelo: "",
    marca: "",
    ano: new Date().getFullYear(),
    capacidade_kg: 0,
    id_usuario: 0,
    id_centro_logistica: 0,
    status: "disponivel"
  });

  // Use controllers
  const { data: trucks = [], isLoading: loadingTrucks } = useCaminhoes(1, 5);
  const { data: users = [] } = useUsers(1, 100);
  const { data: centrosRaw = [] } = useCentrosLogistica(1, 200);
  const drivers = useMemo(
    () => (users as User[]).filter((u) => u.role === "driver"),
    [users],
  );
  const centrosAtivos = useMemo(
    () => (centrosRaw as CentroLogistica[]).filter((c) => c.is_ativo),
    [centrosRaw],
  );
  const createCaminhao = useCreateCaminhao();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]:
        name === "ano" ||
        name === "capacidade_kg" ||
        name === "id_usuario" ||
        name === "id_centro_logistica"
          ? Number(value)
          : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id_usuario === 0) {
      addToast({ message: t("management.caminhoesView.validationDriver", "Por favor, selecione um motorista responsável."), type: "info" });
      return;
    }
    try {
      const payload = {
        placa: formData.placa,
        modelo: formData.modelo,
        marca: formData.marca,
        ano: formData.ano,
        capacidade_kg: formData.capacidade_kg,
        id_usuario: formData.id_usuario,
        status: formData.status,
        ...(formData.id_centro_logistica
          ? { id_centro_logistica: formData.id_centro_logistica }
          : {}),
      };
      await createCaminhao.mutateAsync(payload);
      addToast({ message: t("management.caminhoesView.createSuccess", "Caminhão cadastrado com sucesso!"), type: "success" });
      setFormData({
        placa: "",
        modelo: "",
        marca: "",
        ano: new Date().getFullYear(),
        capacidade_kg: 0,
        id_usuario: 0,
        id_centro_logistica: 0,
        status: "disponivel"
      });
    } catch (error) {
      console.error("Erro ao cadastrar caminhão:", error);
      addToast({ message: t("management.caminhoesView.createError", "Erro ao cadastrar caminhão."), type: "error" });
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">{t("management.caminhoesView.newTruckTitle", "Novo Caminhão")}</h3>
        
        <form className="modern-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <Input
              label={t("management.caminhoesView.plateLabel", "Placa")}
              variant="underlined"
              name="placa"
              placeholder={t("management.caminhoesView.platePlaceholder", "ABC-1234")}
              value={formData.placa}
              onChange={handleInputChange}
              required
            />
            <Input
              label={t("management.caminhoesView.modelLabel", "Modelo")}
              variant="underlined"
              name="modelo"
              placeholder={t("management.caminhoesView.modelPlaceholder", "Ex: FH 540")}
              value={formData.modelo}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <Input
              label={t("management.caminhoesView.brandLabel", "Marca")}
              variant="underlined"
              name="marca"
              placeholder={t("management.caminhoesView.brandPlaceholder", "Ex: Volvo")}
              value={formData.marca}
              onChange={handleInputChange}
              required
            />
            <Input
              label={t("management.caminhoesView.yearLabel", "Ano")}
              variant="underlined"
              type="number"
              name="ano"
              value={formData.ano}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <Input
              label={t("management.caminhoesView.capacityLabel", "Capacidade (kg)")}
              variant="underlined"
              type="number"
              name="capacidade_kg"
              value={formData.capacidade_kg}
              onChange={handleInputChange}
              required
            />
            <Select
              label={t("management.caminhoesView.statusLabel", "Status Inicial")}
              variant="underlined"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: "disponivel", label: t("management.caminhoesView.statusDisponivel", "Disponível") },
                { value: "em_rota", label: t("management.caminhoesView.statusEmRota", "Em Rota") },
                { value: "manutencao", label: t("management.caminhoesView.statusManutencao", "Manutenção") },
                { value: "inativo", label: t("management.caminhoesView.statusInativo", "Inativo") },
              ]}
            />
          </div>

          <Select
            label={t("management.caminhoesView.driverLabel", "Motorista Responsável")}
            variant="underlined"
            name="id_usuario"
            value={formData.id_usuario}
            onChange={handleInputChange}
            options={[
              { value: 0, label: t("management.caminhoesView.driverPlaceholder", "Selecione um motorista...") },
              ...drivers.map((user) => ({
                value: Number(user.id),
                label: user.name,
              })),
            ]}
          />

          <Select
            label={t("management.caminhoesView.centerLabel", "Centro logístico")}
            variant="underlined"
            name="id_centro_logistica"
            value={formData.id_centro_logistica}
            onChange={handleInputChange}
            options={[
              { value: 0, label: t("management.caminhoesView.centerNone", "Nenhum (opcional)") },
              ...centrosAtivos.map((c) => ({
                value: c.id,
                label: c.nome,
              })),
            ]}
          />

          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" variant="primary" size="medium">
              {t("management.caminhoesView.submitButton", "Salvar Caminhão")}
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">{t("management.caminhoesView.listTitle", "Frota Ativa")}</h3>
        {loadingTrucks ? (
          <Loading />
        ) : (
          <>
            <div className="drivers-list">
              {(trucks as CaminhaoCompleto[]).map((truck) => (
                <div key={truck.id} className="driver-mini-card">
                  <div className="avatar-placeholder" style={{ width: '44px', height: '44px', borderRadius: '8px', border: 'none', background: '#f0f2f5', padding: 0, justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  </div>
                  <div className="driver-info">
                    <h4>{truck.placa} · {truck.modelo}</h4>
                    <p className="cell-sub-text" style={{ marginTop: 2 }}>
                      {truck.marca} ({truck.ano})
                    </p>
                    <p className="cell-sub-text" style={{ marginTop: 2 }}>{labelMotorista(truck.nome_motorista)}</p>
                    <p className="cell-sub-text" style={{ marginTop: 2 }}>
                      {t("management.caminhoesView.cargoPrefix", "Carga: ")}{labelTipoCarga(truck.tipo_carga != null && String(truck.tipo_carga).trim() !== "" ? truck.tipo_carga : t("management.caminhoesView.noCargoLinked", "Sem carga vinculada"))}
                    </p>
                    <p className="cell-sub-text" style={{ marginTop: 2 }}>
                      {t("management.caminhoesView.centerPrefix", "Centro: ")}{labelCentro(truck.nome_centro_logistica)}
                    </p>
                  </div>
                  <span className={`status-badge ${truck.status}`} style={{ fontSize: '0.65rem' }}>
                    {truck.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
              {trucks.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>{t("management.caminhoesView.noRecords", "Sem registros.")}</p>}
            </div>
            
            <div className="view-all-container">
              <button className="btn-text" onClick={onViewAll}>
                {t("management.caminhoesView.viewAll", "Listagem Completa →")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
