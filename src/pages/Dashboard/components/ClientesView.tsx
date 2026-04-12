import { useState } from "react";
import { useClientes, useCreateCliente } from "@controllers/clienteController";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import Input from "@components/common/Input";

interface ClientesViewProps {
  onViewAll: () => void;
}

export default function ClientesView({ onViewAll }: ClientesViewProps) {
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
      alert("Cliente cadastrado com sucesso!");
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
      alert("Erro ao cadastrar cliente.");
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">Novo Cliente</h3>
        
        <form className="modern-form" onSubmit={handleSubmit}>
          <Input
            label="Nome Completo / Razão Social"
            variant="underlined"
            name="nome"
            placeholder="Digite o nome..."
            value={formData.nome}
            onChange={handleInputChange}
            required
          />

          <div className="form-row">
            <Input
              label="Email"
              variant="underlined"
              type="email"
              name="email"
              placeholder="Ex: cliente@empresa.com"
              value={formData.email}
              onChange={handleInputChange}
            />
            <Input
              label="Telefone"
              variant="underlined"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <Input
              label="CPF / CNPJ"
              variant="underlined"
              name="documento"
              placeholder="000.000.000-00"
              value={formData.documento}
              onChange={handleInputChange}
            />
            <div className="modern-form-group">
              <label htmlFor="is_ativo" className="input-label-underlined">Status</label>
              <select
                id="is_ativo"
                name="is_ativo"
                className="input-base input-underlined"
                value={formData.is_ativo ? "true" : "false"}
                onChange={(e) => setFormData(prev => ({ ...prev, is_ativo: e.target.value === "true" }))}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <Input
            label="Endereço"
            variant="underlined"
            name="endereco"
            placeholder="Rua, Número, Bairro, Cidade - UF"
            value={formData.endereco}
            onChange={handleInputChange}
          />

          <div className="form-row">
            <Input
              label="Latitude"
              variant="underlined"
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
            />
            <Input
              label="Longitude"
              variant="underlined"
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" variant="primary" size="medium">
              Salvar Cliente
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">Clientes Cadastrados</h3>
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
                    <p>{client.email || client.documento || "Sem contato"}</p>
                  </div>
                  <span className={`status-badge ${client.is_ativo ? "active" : "inactive"}`} style={{ fontSize: '0.65rem' }}>
                    {client.is_ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
              {clients.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Sem registros.</p>}
            </div>
            
            <div className="view-all-container">
              <button className="btn-text" onClick={onViewAll}>
                Listagem Completa →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
