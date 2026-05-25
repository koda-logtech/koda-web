import { useEffect, useState } from "react";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useUpdateUser } from "@controllers/userController";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage } from "@utils/helpers";
import type { User } from "@/types/models";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface MotoristaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface UserFormState {
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}

const EMPTY_STATE: UserFormState = {
  name: "",
  email: "",
  phone: "",
  role: "driver",
  is_active: true,
};

function toFormState(u: User | null): UserFormState {
  if (!u) return EMPTY_STATE;
  return {
    name: u.name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    role: u.role ?? "driver",
    is_active: Boolean(u.is_active),
  };
}

export default function MotoristaEditModal({ isOpen, onClose, user }: MotoristaEditModalProps) {
  const { addToast } = useToast();
  const updateUser = useUpdateUser();
  const [form, setForm] = useState<UserFormState>(EMPTY_STATE);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(user));
    }
  }, [isOpen, user]);

  const handleClose = () => {
    if (updateUser.isPending) return;
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      addToast({ message: "Informe o nome do motorista.", type: "info" });
      return;
    }
    if (!email) {
      addToast({ message: "Informe o email do motorista.", type: "info" });
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: user.id,
        payload: {
          name,
          email,
          phone: form.phone.trim() || null,
          role: form.role,
          is_active: form.is_active,
        },
      });
      addToast({ message: "Motorista atualizado com sucesso!", type: "success" });
      onClose();
    } catch (err) {
      addToast({
        message: `Não foi possível atualizar o motorista. ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen || !user) return null;

  const saving = updateUser.isPending;

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
        aria-labelledby="motorista-edit-title"
      >
        <div className="trips-modal-head">
          <h3 id="motorista-edit-title">Editar motorista</h3>
          <p>
            Atualize as informações do usuário. A senha não pode ser alterada por aqui — ela
            possui um fluxo próprio.
          </p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Input
            label="Nome Completo"
            variant="underlined"
            name="name"
            placeholder="Digite o nome..."
            value={form.name}
            onChange={handleChange}
            required
          />

          <div className="trips-modal-form-row">
            <Input
              label="Email"
              variant="underlined"
              type="email"
              name="email"
              placeholder="Ex: joao@empresa.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Telefone"
              variant="underlined"
              name="phone"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="trips-modal-form-row">
            <Select
              label="Cargo"
              variant="underlined"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                { value: "driver", label: "Motorista" },
                { value: "admin", label: "Administrador" },
                { value: "manager", label: "Gerente" },
                { value: "user", label: "Usuário" },
              ]}
            />
            <Select
              label="Status do Acesso"
              variant="underlined"
              name="is_active"
              value={form.is_active ? "true" : "false"}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))
              }
              options={[
                { value: "true", label: "Liberado (Ativo)" },
                { value: "false", label: "Bloqueado (Inativo)" },
              ]}
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
