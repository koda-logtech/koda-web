import { useEffect, useState } from "react";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useUpdateCentroLogistica } from "@controllers/centroLogisticaController";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import type { CentroLogistica } from "@/types/models";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface CentroLogisticaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  centro: CentroLogistica | null;
}

interface CentroFormState {
  nome: string;
  endereco: string;
  telefone: string;
  latitude: string;
  longitude: string;
  is_ativo: boolean;
}

const EMPTY_STATE: CentroFormState = {
  nome: "",
  endereco: "",
  telefone: "",
  latitude: "0",
  longitude: "0",
  is_ativo: true,
};

function toFormState(c: CentroLogistica | null): CentroFormState {
  if (!c) return EMPTY_STATE;
  return {
    nome: c.nome ?? "",
    endereco: c.endereco ?? "",
    telefone: c.telefone ?? "",
    latitude: c.latitude != null ? String(c.latitude) : "0",
    longitude: c.longitude != null ? String(c.longitude) : "0",
    is_ativo: Boolean(c.is_ativo),
  };
}

export default function CentroLogisticaEditModal({
  isOpen,
  onClose,
  centro,
}: CentroLogisticaEditModalProps) {
  const { addToast } = useToast();
  const updateCentro = useUpdateCentroLogistica();
  const [form, setForm] = useState<CentroFormState>(EMPTY_STATE);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(centro));
    }
  }, [isOpen, centro]);

  const handleClose = () => {
    if (updateCentro.isPending) return;
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centro) return;

    const nome = form.nome.trim();
    if (!nome) {
      addToast({ message: "Informe o nome do centro logístico.", type: "info" });
      return;
    }

    const lat = Number.parseFloat(String(form.latitude).replace(",", "."));
    const lng = Number.parseFloat(String(form.longitude).replace(",", "."));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      addToast({ message: "Latitude e longitude devem ser números válidos.", type: "info" });
      return;
    }

    try {
      await updateCentro.mutateAsync({
        id: centro.id,
        payload: {
          nome,
          endereco: form.endereco.trim() || null,
          telefone: form.telefone.trim() || null,
          latitude: lat,
          longitude: lng,
          is_ativo: form.is_ativo,
        },
      });
      addToast({ message: "Centro logístico atualizado com sucesso!", type: "success" });
      onClose();
    } catch (err) {
      addToast({
        message: `Não foi possível atualizar o centro logístico. ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen || !centro) return null;

  const saving = updateCentro.isPending;

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
        aria-labelledby="centro-edit-title"
      >
        <div className="trips-modal-head">
          <h3 id="centro-edit-title">Editar centro logístico</h3>
          <p>Atualize as informações da unidade selecionada.</p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Input
            label="Nome da unidade"
            variant="underlined"
            name="nome"
            placeholder="Ex: CD São Paulo – Zona Sul"
            value={form.nome}
            onChange={handleChange}
            required
          />

          <div className="trips-modal-form-row">
            <Input
              label="Telefone"
              variant="underlined"
              name="telefone"
              placeholder="(00) 0000-0000"
              value={form.telefone}
              onChange={handleChange}
            />
            <Select
              label="Status"
              variant="underlined"
              name="is_ativo"
              value={form.is_ativo ? "true" : "false"}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_ativo: e.target.value === "true" }))
              }
              options={[
                { value: "true", label: "Ativo" },
                { value: "false", label: "Inativo" },
              ]}
            />
          </div>

          <Input
            label="Endereço completo"
            variant="underlined"
            name="endereco"
            placeholder="Rua, número, bairro, cidade – UF"
            value={form.endereco}
            onChange={handleChange}
          />

          <div className="trips-modal-form-row">
            <Input
              label="Latitude"
              variant="underlined"
              type="number"
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
            />
            <Input
              label="Longitude"
              variant="underlined"
              type="number"
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
            />
          </div>

          <div className="trips-modal-actions">
            <Button type="button" variant="secondary" size="medium" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="medium" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
