import { useEffect, useState } from "react";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useUpdateArmazem } from "@controllers/armazemController";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import type { Armazem } from "@/types/models";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface ArmazemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  armazem: Armazem | null;
}

interface ArmazemFormState {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  capacidade_kg: string;
  latitude: string;
  longitude: string;
  is_ativo: boolean;
}

const EMPTY_STATE: ArmazemFormState = {
  nome: "",
  endereco: "",
  telefone: "",
  email: "",
  capacidade_kg: "0",
  latitude: "0",
  longitude: "0",
  is_ativo: true,
};

function toFormState(a: Armazem | null): ArmazemFormState {
  if (!a) return EMPTY_STATE;
  return {
    nome: a.nome ?? "",
    endereco: a.endereco ?? "",
    telefone: a.telefone ?? "",
    email: a.email ?? "",
    capacidade_kg: a.capacidade_kg != null ? String(a.capacidade_kg) : "0",
    latitude: a.latitude != null ? String(a.latitude) : "0",
    longitude: a.longitude != null ? String(a.longitude) : "0",
    is_ativo: Boolean(a.is_ativo),
  };
}

export default function ArmazemEditModal({ isOpen, onClose, armazem }: ArmazemEditModalProps) {
  const { addToast } = useToast();
  const updateArmazem = useUpdateArmazem();
  const [form, setForm] = useState<ArmazemFormState>(EMPTY_STATE);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(armazem));
    }
  }, [isOpen, armazem]);

  const handleClose = () => {
    if (updateArmazem.isPending) return;
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!armazem) return;

    const nome = form.nome.trim();
    if (!nome) {
      addToast({ message: "Informe o nome do armazém.", type: "info" });
      return;
    }

    const capacidade = Number.parseFloat(String(form.capacidade_kg).replace(",", "."));
    const lat = Number.parseFloat(String(form.latitude).replace(",", "."));
    const lng = Number.parseFloat(String(form.longitude).replace(",", "."));

    if (!Number.isFinite(capacidade) || capacidade < 0) {
      addToast({ message: "Capacidade deve ser um número válido.", type: "info" });
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      addToast({ message: "Latitude e longitude devem ser números válidos.", type: "info" });
      return;
    }

    try {
      await updateArmazem.mutateAsync({
        id: armazem.id,
        payload: {
          nome,
          endereco: form.endereco.trim() || null,
          telefone: form.telefone.trim() || null,
          email: form.email.trim() || null,
          capacidade_kg: capacidade,
          latitude: lat,
          longitude: lng,
          is_ativo: form.is_ativo,
        },
      });
      addToast({ message: "Armazém atualizado com sucesso!", type: "success" });
      onClose();
    } catch (err) {
      addToast({
        message: `Não foi possível atualizar o armazém. ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen || !armazem) return null;

  const saving = updateArmazem.isPending;

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
        aria-labelledby="armazem-edit-title"
      >
        <div className="trips-modal-head">
          <h3 id="armazem-edit-title">Editar armazém</h3>
          <p>Atualize as informações do armazém parceiro selecionado.</p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Input
            label="Nome do Armazém"
            variant="underlined"
            name="nome"
            placeholder="Digite o nome..."
            value={form.nome}
            onChange={handleChange}
            required
          />

          <div className="trips-modal-form-row">
            <Input
              label="Email de Contato"
              variant="underlined"
              type="email"
              name="email"
              placeholder="Ex: armazem@parceiro.com"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              label="Telefone"
              variant="underlined"
              name="telefone"
              placeholder="(00) 0000-0000"
              value={form.telefone}
              onChange={handleChange}
            />
          </div>

          <div className="trips-modal-form-row">
            <Input
              label="Capacidade (kg)"
              variant="underlined"
              type="number"
              name="capacidade_kg"
              value={form.capacidade_kg}
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
            label="Endereço Completo"
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
