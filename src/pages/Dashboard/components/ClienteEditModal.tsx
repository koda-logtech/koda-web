import { useEffect, useState } from "react";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useUpdateCliente } from "@controllers/clienteController";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import type { Cliente } from "@/types/models";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface ClienteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

interface ClienteFormState {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco: string;
  latitude: string;
  longitude: string;
  is_ativo: boolean;
}

const EMPTY_STATE: ClienteFormState = {
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  endereco: "",
  latitude: "0",
  longitude: "0",
  is_ativo: true,
};

function toFormState(c: Cliente | null): ClienteFormState {
  if (!c) return EMPTY_STATE;
  return {
    nome: c.nome ?? "",
    email: c.email ?? "",
    telefone: c.telefone ?? "",
    documento: c.documento ?? "",
    endereco: c.endereco ?? "",
    latitude: c.latitude != null ? String(c.latitude) : "0",
    longitude: c.longitude != null ? String(c.longitude) : "0",
    is_ativo: Boolean(c.is_ativo),
  };
}

export default function ClienteEditModal({ isOpen, onClose, cliente }: ClienteEditModalProps) {
  const { addToast } = useToast();
  const updateCliente = useUpdateCliente();
  const [form, setForm] = useState<ClienteFormState>(EMPTY_STATE);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(cliente));
    }
  }, [isOpen, cliente]);

  const handleClose = () => {
    if (updateCliente.isPending) return;
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    const nome = form.nome.trim();
    if (!nome) {
      addToast({ message: "Informe o nome do cliente.", type: "info" });
      return;
    }

    const lat = Number.parseFloat(String(form.latitude).replace(",", "."));
    const lng = Number.parseFloat(String(form.longitude).replace(",", "."));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      addToast({ message: "Latitude e longitude devem ser números válidos.", type: "info" });
      return;
    }

    try {
      await updateCliente.mutateAsync({
        id: cliente.id,
        payload: {
          nome,
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
          documento: form.documento.trim() || null,
          endereco: form.endereco.trim() || null,
          latitude: lat,
          longitude: lng,
          is_ativo: form.is_ativo,
        },
      });
      addToast({ message: "Cliente atualizado com sucesso!", type: "success" });
      onClose();
    } catch (err) {
      addToast({
        message: `Não foi possível atualizar o cliente. ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen || !cliente) return null;

  const saving = updateCliente.isPending;

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
        aria-labelledby="cliente-edit-title"
      >
        <div className="trips-modal-head">
          <h3 id="cliente-edit-title">Editar cliente</h3>
          <p>Atualize as informações do cliente selecionado.</p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Input
            label="Nome Completo / Razão Social"
            variant="underlined"
            name="nome"
            placeholder="Digite o nome..."
            value={form.nome}
            onChange={handleChange}
            required
          />

          <div className="trips-modal-form-row">
            <Input
              label="Email"
              variant="underlined"
              type="email"
              name="email"
              placeholder="Ex: cliente@empresa.com"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              label="Telefone"
              variant="underlined"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={handleChange}
            />
          </div>

          <div className="trips-modal-form-row">
            <Input
              label="CPF / CNPJ"
              variant="underlined"
              name="documento"
              placeholder="000.000.000-00"
              value={form.documento}
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
            label="Endereço"
            variant="underlined"
            name="endereco"
            placeholder="Rua, Número, Bairro, Cidade - UF"
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
