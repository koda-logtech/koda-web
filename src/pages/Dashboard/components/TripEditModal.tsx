import { useEffect, useState } from "react";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useCaminhoes } from "@controllers/caminhaoController";
import { useClientes } from "@controllers/clienteController";
import { useUpdateEntrega } from "@controllers/entregaController";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import { formatCaminhaoOptionLabel } from "@utils/caminhaoOptionLabel";
import type { CaminhaoCompleto, Cliente, Entrega, EntregaCompleta } from "@/types/models";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface TripEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrega: EntregaCompleta | Entrega | null;
}

interface TripFormState {
  id_caminhao: number;
  id_cliente: number;
  status: Entrega["status"];
  data_saida: string;
  data_previsao: string;
  data_entrega: string;
  observacoes: string;
}

const EMPTY_STATE: TripFormState = {
  id_caminhao: 0,
  id_cliente: 0,
  status: "pendente",
  data_saida: "",
  data_previsao: "",
  data_entrega: "",
  observacoes: "",
};

/** Converte ISO ("2026-01-15T13:45:00.000Z") para o formato aceito por `datetime-local`. */
function isoToInputValue(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toFormState(e: EntregaCompleta | Entrega | null): TripFormState {
  if (!e) return EMPTY_STATE;
  return {
    id_caminhao: Number(e.id_caminhao ?? 0),
    id_cliente: Number(e.id_cliente ?? 0),
    status: e.status ?? "pendente",
    data_saida: isoToInputValue(e.data_saida),
    data_previsao: isoToInputValue(e.data_previsao),
    data_entrega: isoToInputValue(e.data_entrega),
    observacoes: e.observacoes ?? "",
  };
}

export default function TripEditModal({ isOpen, onClose, entrega }: TripEditModalProps) {
  const { addToast } = useToast();
  const updateEntrega = useUpdateEntrega();
  const { data: caminhoes = [] } = useCaminhoes(1, 300, { enabled: isOpen });
  const { data: clientes = [] } = useClientes(1, 500, { enabled: isOpen });
  const [form, setForm] = useState<TripFormState>(EMPTY_STATE);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(entrega));
    }
  }, [isOpen, entrega]);

  const handleClose = () => {
    if (updateEntrega.isPending) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrega) return;

    if (!form.id_caminhao) {
      addToast({ message: "Selecione um caminhão.", type: "info" });
      return;
    }
    if (!form.id_cliente) {
      addToast({ message: "Selecione um cliente (destino).", type: "info" });
      return;
    }

    const payload: Partial<Omit<Entrega, "id" | "created_at" | "updated_at">> = {
      id_caminhao: form.id_caminhao,
      id_cliente: form.id_cliente,
      status: form.status,
      data_saida: form.data_saida ? new Date(form.data_saida).toISOString() : undefined,
      data_previsao: form.data_previsao ? new Date(form.data_previsao).toISOString() : undefined,
      data_entrega: form.data_entrega ? new Date(form.data_entrega).toISOString() : undefined,
      observacoes: form.observacoes.trim() ? form.observacoes.trim() : undefined,
    };

    try {
      await updateEntrega.mutateAsync({ id: entrega.id, payload });
      addToast({ message: "Viagem atualizada com sucesso!", type: "success" });
      onClose();
    } catch (err) {
      addToast({
        message: `Não foi possível atualizar a viagem. ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen || !entrega) return null;

  const saving = updateEntrega.isPending;
  const caminhoesLista = caminhoes as CaminhaoCompleto[];
  const clientesLista = clientes as Cliente[];

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
        aria-labelledby="trip-edit-title"
      >
        <div className="trips-modal-head">
          <h3 id="trip-edit-title">Editar viagem</h3>
          <p>Atualize a viagem selecionada — caminhão, cliente, status, datas e observações.</p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Select
            label="Caminhão"
            variant="underlined"
            name="id_caminhao"
            value={form.id_caminhao}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, id_caminhao: Number(e.target.value) }))
            }
            options={[
              { value: 0, label: "Selecione um caminhão..." },
              ...caminhoesLista.map((c) => ({
                value: c.id,
                label: formatCaminhaoOptionLabel(c),
              })),
            ]}
          />

          <Select
            label="Cliente / destino"
            variant="underlined"
            name="id_cliente"
            value={form.id_cliente}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, id_cliente: Number(e.target.value) }))
            }
            options={[
              { value: 0, label: "Selecione um cliente..." },
              ...clientesLista.map((cl) => ({
                value: cl.id,
                label: cl.endereco?.trim() ? `${cl.nome} — ${cl.endereco}` : cl.nome,
              })),
            ]}
          />

          <Select
            label="Status"
            variant="underlined"
            name="status"
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                status: e.target.value as Entrega["status"],
              }))
            }
            options={[
              { value: "pendente", label: "Pendente" },
              { value: "em_transito", label: "Em trânsito" },
              { value: "no_armazem", label: "No armazém" },
              { value: "entregue", label: "Entregue" },
              { value: "cancelada", label: "Cancelada" },
            ]}
          />

          <div className="trips-modal-form-row">
            <Input
              label="Data de saída"
              variant="underlined"
              name="data_saida"
              type="datetime-local"
              value={form.data_saida}
              onChange={(e) => setForm((prev) => ({ ...prev, data_saida: e.target.value }))}
            />
            <Input
              label="Data de previsão"
              variant="underlined"
              name="data_previsao"
              type="datetime-local"
              value={form.data_previsao}
              onChange={(e) => setForm((prev) => ({ ...prev, data_previsao: e.target.value }))}
            />
          </div>

          <Input
            label="Data de entrega"
            variant="underlined"
            name="data_entrega"
            type="datetime-local"
            value={form.data_entrega}
            onChange={(e) => setForm((prev) => ({ ...prev, data_entrega: e.target.value }))}
          />

          <label className="trips-modal-label" htmlFor="trip-edit-obs">
            Observações
          </label>
          <textarea
            id="trip-edit-obs"
            className="trips-modal-textarea"
            rows={3}
            placeholder="Instruções ao motorista, restrições de descarga..."
            value={form.observacoes}
            onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
          />

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
