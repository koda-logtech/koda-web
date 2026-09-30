import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useUpdateCaminhao } from "@controllers/caminhaoController";
import { useUsers } from "@controllers/userController";
import { useCentrosLogistica } from "@controllers/centroLogisticaController";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import type { Caminhao, CaminhaoCompleto, CentroLogistica, User } from "@/types/models";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface CaminhaoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  caminhao: CaminhaoCompleto | Caminhao | null;
}

interface CaminhaoFormState {
  placa: string;
  modelo: string;
  marca: string;
  ano: string;
  capacidade_kg: string;
  id_usuario: number;
  id_centro_logistica: number;
  status: Caminhao["status"];
}

const EMPTY_STATE: CaminhaoFormState = {
  placa: "",
  modelo: "",
  marca: "",
  ano: String(new Date().getFullYear()),
  capacidade_kg: "0",
  id_usuario: 0,
  id_centro_logistica: 0,
  status: "disponivel",
};

function toFormState(c: CaminhaoCompleto | Caminhao | null): CaminhaoFormState {
  if (!c) return EMPTY_STATE;
  return {
    placa: c.placa ?? "",
    modelo: c.modelo ?? "",
    marca: c.marca ?? "",
    ano: c.ano != null ? String(c.ano) : String(new Date().getFullYear()),
    capacidade_kg: c.capacidade_kg != null ? String(c.capacidade_kg) : "0",
    id_usuario: Number(c.id_usuario ?? 0),
    id_centro_logistica: Number(c.id_centro_logistica ?? 0),
    status: c.status ?? "disponivel",
  };
}

export default function CaminhaoEditModal({ isOpen, onClose, caminhao }: CaminhaoEditModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const updateCaminhao = useUpdateCaminhao();
  const { data: users = [] } = useUsers(1, 100, { enabled: isOpen });
  const { data: centrosRaw = [] } = useCentrosLogistica(1, 200, { enabled: isOpen });

  const drivers = useMemo(
    () => (users as User[]).filter((u) => u.role === "driver"),
    [users],
  );
  const centrosAtivos = useMemo(
    () => (centrosRaw as CentroLogistica[]).filter((c) => c.is_ativo),
    [centrosRaw],
  );

  const [form, setForm] = useState<CaminhaoFormState>(EMPTY_STATE);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(caminhao));
    }
  }, [isOpen, caminhao]);

  const handleClose = () => {
    if (updateCaminhao.isPending) return;
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "id_usuario" || name === "id_centro_logistica" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caminhao) return;

    const placa = form.placa.trim();
    const modelo = form.modelo.trim();
    const marca = form.marca.trim();

    if (!placa || !modelo || !marca) {
      addToast({ message: t("modals.caminhao.validationRequired", "Placa, modelo e marca são obrigatórios."), type: "info" });
      return;
    }

    const ano = Number.parseInt(String(form.ano), 10);
    const capacidade = Number.parseFloat(String(form.capacidade_kg).replace(",", "."));

    if (!Number.isFinite(ano) || ano < 1900) {
      addToast({ message: t("modals.caminhao.validationYear", "Informe um ano válido."), type: "info" });
      return;
    }
    if (!Number.isFinite(capacidade) || capacidade < 0) {
      addToast({ message: t("modals.caminhao.validationCapacity", "Capacidade deve ser um número válido."), type: "info" });
      return;
    }
    if (!form.id_usuario) {
      addToast({ message: t("modals.caminhao.validationDriver", "Selecione um motorista responsável."), type: "info" });
      return;
    }

    try {
      await updateCaminhao.mutateAsync({
        id: caminhao.id,
        payload: {
          placa,
          modelo,
          marca,
          ano,
          capacidade_kg: capacidade,
          id_usuario: form.id_usuario,
          id_centro_logistica: form.id_centro_logistica || undefined,
          status: form.status,
        },
      });
      addToast({ message: t("modals.caminhao.updateSuccess", "Caminhão atualizado com sucesso!"), type: "success" });
      onClose();
    } catch (err) {
      addToast({
        message: `${t("modals.caminhao.updateError", "Não foi possível atualizar o caminhão.")} ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen || !caminhao) return null;

  const saving = updateCaminhao.isPending;

  return (
    <div
      className="modal-overlay trips-create-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="modal-content trips-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="caminhao-edit-title"
      >
        <div className="trips-modal-head">
          <h3 id="caminhao-edit-title">{t("modals.caminhao.editTitle", "Editar caminhão")}</h3>
          <p>{t("modals.caminhao.editSubtitle", "Atualize as informações do veículo selecionado.")}</p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <div className="trips-modal-form-row">
            <Input
              label={t("modals.caminhao.plateLabel", "Placa")}
              variant="underlined"
              name="placa"
              placeholder={t("modals.caminhao.platePlaceholder", "ABC-1234")}
              value={form.placa}
              onChange={handleChange}
              required
            />
            <Input
              label={t("modals.caminhao.modelLabel", "Modelo")}
              variant="underlined"
              name="modelo"
              placeholder={t("modals.caminhao.modelPlaceholder", "Ex: FH 540")}
              value={form.modelo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="trips-modal-form-row">
            <Input
              label={t("modals.caminhao.brandLabel", "Marca")}
              variant="underlined"
              name="marca"
              placeholder={t("modals.caminhao.brandPlaceholder", "Ex: Volvo")}
              value={form.marca}
              onChange={handleChange}
              required
            />
            <Input
              label={t("modals.caminhao.yearLabel", "Ano")}
              variant="underlined"
              type="number"
              name="ano"
              value={form.ano}
              onChange={handleChange}
              required
            />
          </div>

          <div className="trips-modal-form-row">
            <Input
              label={t("modals.caminhao.capacityLabel", "Capacidade (kg)")}
              variant="underlined"
              type="number"
              name="capacidade_kg"
              value={form.capacidade_kg}
              onChange={handleChange}
              required
            />
            <Select
              label={t("modals.caminhao.statusLabel", "Status")}
              variant="underlined"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={[
                { value: "disponivel", label: t("modals.caminhao.statusDisponivel", "Disponível") },
                { value: "em_espera", label: t("modals.caminhao.statusEmEspera", "Em Espera") },
                { value: "em_rota", label: t("modals.caminhao.statusEmRota", "Em Rota") },
                { value: "manutencao", label: t("modals.caminhao.statusManutencao", "Manutenção") },
                { value: "inativo", label: t("modals.caminhao.statusInativo", "Inativo") },
              ]}
            />
          </div>

          <Select
            label={t("modals.caminhao.driverLabel", "Motorista Responsável")}
            variant="underlined"
            name="id_usuario"
            value={form.id_usuario}
            onChange={handleChange}
            options={[
              { value: 0, label: t("modals.caminhao.driverPlaceholder", "Selecione um motorista...") },
              ...drivers.map((u) => ({
                value: Number(u.id),
                label: u.name,
              })),
            ]}
          />

          <Select
            label={t("modals.caminhao.centerLabel", "Centro logístico")}
            variant="underlined"
            name="id_centro_logistica"
            value={form.id_centro_logistica}
            onChange={handleChange}
            options={[
              { value: 0, label: t("modals.caminhao.centerNone", "Nenhum (opcional)") },
              ...centrosAtivos.map((c) => ({
                value: c.id,
                label: c.nome,
              })),
            ]}
          />

          <div className="trips-modal-actions">
            <Button type="button" variant="secondary" size="medium" onClick={handleClose} disabled={saving}>
              {t("modals.caminhao.cancel", "Cancelar")}
            </Button>
            <Button type="submit" variant="primary" size="medium" disabled={saving}>
              {saving ? t("modals.caminhao.saving", "Salvando...") : t("modals.caminhao.saveChanges", "Salvar alterações")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
