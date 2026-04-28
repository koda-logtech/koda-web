import { useState } from "react";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useCaminhoes } from "@controllers/caminhaoController";
import { useClientes } from "@controllers/clienteController";
import { useCreateEntrega } from "@controllers/entregaController";
import { useToast } from "@/contexts/ToastContext";
import type { CaminhaoCompleto, Cliente } from "@/types/models";
import { formatCaminhaoOptionLabel } from "@utils/caminhaoOptionLabel";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface TripCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TripCreateModal({ isOpen, onClose }: TripCreateModalProps) {
  const { addToast } = useToast();
  const { data: caminhoes = [] } = useCaminhoes(1, 300);
  const { data: clientes = [] } = useClientes(1, 500);
  const createEntrega = useCreateEntrega();

  const [idCaminhao, setIdCaminhao] = useState(0);
  const [idCliente, setIdCliente] = useState(0);
  const [dataSaida, setDataSaida] = useState("");
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const reset = () => {
    setIdCaminhao(0);
    setIdCliente(0);
    setDataSaida("");
    setDataPrevisao("");
    setObservacoes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCaminhao) {
      addToast({ message: "Selecione um caminhão.", type: "info" });
      return;
    }
    if (!idCliente) {
      addToast({ message: "Selecione um cliente (destino).", type: "info" });
      return;
    }

    const payload = {
      id_caminhao: idCaminhao,
      id_cliente: idCliente,
      status: "pendente" as const,
      ...(dataSaida ? { data_saida: new Date(dataSaida).toISOString() } : {}),
      ...(dataPrevisao ? { data_previsao: new Date(dataPrevisao).toISOString() } : {}),
      ...(observacoes.trim() ? { observacoes: observacoes.trim() } : {}),
    };

    try {
      await createEntrega.mutateAsync(payload);
      addToast({ message: "Entrega criada com sucesso.", type: "success" });
      handleClose();
    } catch {
      addToast({
        message: "Não foi possível criar a entrega. Verifique os dados e tente novamente.",
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

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
        aria-labelledby="trips-modal-title"
      >
        <div className="trips-modal-head">
          <h3 id="trips-modal-title">Nova viagem</h3>
          <p>
            Nova entrega inicia como <strong>pendente</strong>. Escolha o caminhão, o cliente e as
            datas previstas.
          </p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Select
            label="Caminhão"
            variant="underlined"
            name="idCaminhao"
            value={idCaminhao}
            onChange={(e) => setIdCaminhao(Number(e.target.value))}
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
            name="idCliente"
            value={idCliente}
            onChange={(e) => setIdCliente(Number(e.target.value))}
            options={[
              { value: 0, label: "Selecione um cliente..." },
              ...clientesLista.map((cl) => ({
                value: cl.id,
                label: cl.endereco?.trim()
                  ? `${cl.nome} — ${cl.endereco}`
                  : cl.nome,
              })),
            ]}
          />

          <div className="trips-modal-form-row">
            <Input
              label="Data de saída"
              variant="underlined"
              name="dataSaida"
              type="datetime-local"
              value={dataSaida}
              onChange={(e) => setDataSaida(e.target.value)}
            />
            <Input
              label="Data de previsão"
              variant="underlined"
              name="dataPrevisao"
              type="datetime-local"
              value={dataPrevisao}
              onChange={(e) => setDataPrevisao(e.target.value)}
            />
          </div>

          <label className="trips-modal-label" htmlFor="trip-obs">
            Observações
          </label>
          <textarea
            id="trip-obs"
            className="trips-modal-textarea"
            rows={3}
            placeholder="Instruções ao motorista, restrições de descarga..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />

          <div className="trips-modal-actions">
            <Button type="button" variant="secondary" size="medium" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="medium"
              disabled={createEntrega.isPending}
            >
              {createEntrega.isPending ? "Salvando..." : "Criar viagem"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
