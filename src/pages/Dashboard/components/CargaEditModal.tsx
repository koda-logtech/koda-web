import { useEffect, useState } from "react";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import { useUpdateCarga } from "@controllers/cargaController";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import type { Carga } from "@/types/models";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface CargaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  carga: Carga | null;
}

interface CargaFormState {
  tipo: string;
  temperatura_minima: string;
  temperatura_maxima: string;
  temperatura_atual: string;
  latitude: string;
  longitude: string;
}

const EMPTY_STATE: CargaFormState = {
  tipo: "",
  temperatura_minima: "0",
  temperatura_maxima: "0",
  temperatura_atual: "0",
  latitude: "0",
  longitude: "0",
};

function toFormState(c: Carga | null): CargaFormState {
  if (!c) return EMPTY_STATE;
  return {
    tipo: c.tipo ?? "",
    temperatura_minima: c.temperatura_minima != null ? String(c.temperatura_minima) : "0",
    temperatura_maxima: c.temperatura_maxima != null ? String(c.temperatura_maxima) : "0",
    temperatura_atual: c.temperatura_atual != null ? String(c.temperatura_atual) : "0",
    latitude: c.latitude != null ? String(c.latitude) : "0",
    longitude: c.longitude != null ? String(c.longitude) : "0",
  };
}

export default function CargaEditModal({ isOpen, onClose, carga }: CargaEditModalProps) {
  const { addToast } = useToast();
  const updateCarga = useUpdateCarga();
  const [form, setForm] = useState<CargaFormState>(EMPTY_STATE);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(carga));
    }
  }, [isOpen, carga]);

  const handleClose = () => {
    if (updateCarga.isPending) return;
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carga) return;

    const tipo = form.tipo.trim();
    if (!tipo) {
      addToast({ message: "Informe o tipo da carga.", type: "info" });
      return;
    }

    const min = Number.parseFloat(String(form.temperatura_minima).replace(",", "."));
    const max = Number.parseFloat(String(form.temperatura_maxima).replace(",", "."));
    const atual = Number.parseFloat(String(form.temperatura_atual).replace(",", "."));
    const lat = Number.parseFloat(String(form.latitude).replace(",", "."));
    const lng = Number.parseFloat(String(form.longitude).replace(",", "."));

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      addToast({
        message: "Preencha temperaturas mínima e máxima com números válidos.",
        type: "info",
      });
      return;
    }
    if (min > max) {
      addToast({
        message: "A temperatura mínima não pode ser maior que a máxima.",
        type: "info",
      });
      return;
    }
    if (!Number.isFinite(atual)) {
      addToast({ message: "Temperatura atual deve ser um número válido.", type: "info" });
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      addToast({ message: "Latitude e longitude devem ser números válidos.", type: "info" });
      return;
    }

    try {
      await updateCarga.mutateAsync({
        id: carga.id,
        payload: {
          tipo,
          temperatura_minima: min,
          temperatura_maxima: max,
          temperatura_atual: atual,
          latitude: lat,
          longitude: lng,
        },
      });
      addToast({ message: "Carga atualizada com sucesso!", type: "success" });
      onClose();
    } catch (err) {
      addToast({
        message: `Não foi possível atualizar a carga. ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen || !carga) return null;

  const saving = updateCarga.isPending;

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
        aria-labelledby="carga-edit-title"
      >
        <div className="trips-modal-head">
          <h3 id="carga-edit-title">Editar carga</h3>
          <p>
            Ajuste o tipo, faixa de temperatura e localização da carga. O vínculo com o caminhão
            é gerenciado pela tabela de caminhões.
          </p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Input
            label="Tipo de carga"
            variant="underlined"
            name="tipo"
            placeholder="Ex.: refrigerada, seca, frigorífica..."
            value={form.tipo}
            onChange={handleChange}
            required
          />

          <div className="trips-modal-form-row">
            <Input
              label="Temp. mínima (°C)"
              variant="underlined"
              name="temperatura_minima"
              type="text"
              inputMode="decimal"
              value={form.temperatura_minima}
              onChange={handleChange}
            />
            <Input
              label="Temp. máxima (°C)"
              variant="underlined"
              name="temperatura_maxima"
              type="text"
              inputMode="decimal"
              value={form.temperatura_maxima}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Temp. atual (°C)"
            variant="underlined"
            name="temperatura_atual"
            type="text"
            inputMode="decimal"
            value={form.temperatura_atual}
            onChange={handleChange}
          />

          <div className="trips-modal-form-row">
            <Input
              label="Latitude"
              variant="underlined"
              name="latitude"
              type="text"
              inputMode="decimal"
              value={form.latitude}
              onChange={handleChange}
            />
            <Input
              label="Longitude"
              variant="underlined"
              name="longitude"
              type="text"
              inputMode="decimal"
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
