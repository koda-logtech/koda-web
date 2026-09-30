import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useClientes, useCreateCliente } from "@controllers/clienteController";
import { useToast } from "@/contexts/ToastContext";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import Input from "@components/common/Input";
import Select from "@components/common/Select";

interface ClientesViewProps {
  onViewAll: () => void;
}

export default function ClientesView({ onViewAll }: ClientesViewProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    documento: "",
    endereco: "",
    latitude: 0,
    longitude: 0,
    is_ativo: true
  });

  // Use controllers
  const { data: clients = [], isLoading: loadingClients } = useClientes(1, 5);
  const createCliente = useCreateCliente();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "latitude" || name === "longitude" ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCliente.mutateAsync(formData);
      addToast({ message: t("management.clientesView.createSuccess", "Cliente cadastrado com sucesso!"), type: "success" });
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        documento: "",
        endereco: "",
        latitude: 0,
        longitude: 0,
        is_ativo: true
      });
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      addToast({ message: t("management.clientesView.createError", "Erro ao cadastrar cliente."), type: "error" });
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">{t("management.clientesView.newClientTitle", "Novo Cliente")}</h3>
        
        <form className="modern-form" onSubmit={handleSubmit}>
          <Input
            label={t("management.clientesView.nameLabel", "Nome Completo / Razão Social")}
            variant="underlined"
            name="nome"
            placeholder={t("management.clientesView.namePlaceholder", "Digite o nome...")}
            value={formData.nome}
            onChange={handleInputChange}
            required
          />

          <div className="form-row">
            <Input
              label={t("management.clientesView.emailLabel", "Email")}
              variant="underlined"
              type="email"
              name="email"
              placeholder={t("management.clientesView.emailPlaceholder", "Ex: cliente@empresa.com")}
              value={formData.email}
              onChange={handleInputChange}
            />
            <Input
              label={t("management.clientesView.phoneLabel", "Telefone")}
              variant="underlined"
              name="telefone"
              placeholder={t("management.clientesView.phonePlaceholder", "(00) 00000-0000")}
              value={formData.telefone}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <Input
              label={t("management.clientesView.docLabel", "CPF / CNPJ")}
              variant="underlined"
              name="documento"
              placeholder={t("management.clientesView.docPlaceholder", "000.000.000-00")}
              value={formData.documento}
              onChange={handleInputChange}
            />
            <Select
              label={t("management.clientesView.statusLabel", "Status")}
              variant="underlined"
              name="is_ativo"
              value={formData.is_ativo ? "true" : "false"}
              onChange={(e) => setFormData(prev => ({ ...prev, is_ativo: e.target.value === "true" }))}
              options={[
                { value: "true", label: t("management.clientesView.statusActive", "Ativo") },
                { value: "false", label: t("management.clientesView.statusInactive", "Inativo") }
              ]}
            />
          </div>

          <Input
            label={t("management.clientesView.addressLabel", "Endereço")}
            variant="underlined"
            name="endereco"
            placeholder={t("management.clientesView.addressPlaceholder", "Rua, Número, Bairro, Cidade - UF")}
            value={formData.endereco}
            onChange={handleInputChange}
          />

          <div className="form-row">
            <Input
              label={t("management.clientesView.latitudeLabel", "Latitude")}
              variant="underlined"
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
            />
            <Input
              label={t("management.clientesView.longitudeLabel", "Longitude")}
              variant="underlined"
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" variant="primary" size="medium">
              {t("management.clientesView.submitButton", "Salvar Cliente")}
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">{t("management.clientesView.listTitle", "Clientes Cadastrados")}</h3>
        {loadingClients ? (
          <Loading />
        ) : (
          <>
            <div className="drivers-list">
              {clients.map((client: any) => (
                <div key={client.id} className="driver-mini-card">
                  <div className="avatar-placeholder" style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#f0f2f5', padding: 0, justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <div className="driver-info">
                    <h4>{client.nome}</h4>
                    <p>{client.email || client.documento || t("management.clientesView.noContact", "Sem contato")}</p>
                  </div>
                  <span className={`status-badge ${client.is_ativo ? "active" : "inactive"}`} style={{ fontSize: '0.65rem' }}>
                    {client.is_ativo ? t("management.clientesView.statusActive", "Ativo") : t("management.clientesView.statusInactive", "Inativo")}
                  </span>
                </div>
              ))}
              {clients.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>{t("management.clientesView.noRecords", "Sem registros.")}</p>}
            </div>
            
            <div className="view-all-container">
              <button className="btn-text" onClick={onViewAll}>
                {t("management.clientesView.viewAll", "Listagem Completa →")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
