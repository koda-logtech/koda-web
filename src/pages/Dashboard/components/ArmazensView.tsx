import { useState } from "react";
import { useArmazens, useCreateArmazem } from "@controllers/armazemController";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import Input from "@components/common/Input";

interface ArmazensViewProps {
  onViewAll: () => void;
}

export default function ArmazensView({ onViewAll }: ArmazensViewProps) {
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
    capacidade_kg: 0,
    latitude: 0,
    longitude: 0,
    is_ativo: true
  });

  // Use controllers
  const { data: warehouses = [], isLoading: loadingWarehouses } = useArmazens(1, 5);
  const createArmazem = useCreateArmazem();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "latitude" || name === "longitude" || name === "capacidade_kg" ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createArmazem.mutateAsync(formData);
      alert("Armazém cadastrado com sucesso!");
      setFormData({
        nome: "",
        endereco: "",
        telefone: "",
        email: "",
        capacidade_kg: 0,
        latitude: 0,
        longitude: 0,
        is_ativo: true
      });
    } catch (error) {
      console.error("Erro ao cadastrar armazém:", error);
      alert("Erro ao cadastrar armazém.");
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">Novo Armazém Parceiro</h3>
        
        <form className="modern-form" onSubmit={handleSubmit}>
          <Input
            label="Nome do Armazém"
            variant="underlined"
            name="nome"
            placeholder="Digite o nome..."
            value={formData.nome}
            onChange={handleInputChange}
            required
          />

          <div className="form-row">
            <Input
              label="Email de Contato"
              variant="underlined"
              type="email"
              name="email"
              placeholder="Ex: armazem@parceiro.com"
              value={formData.email}
              onChange={handleInputChange}
            />
            <Input
              label="Telefone"
              variant="underlined"
              name="telefone"
              placeholder="(00) 0000-0000"
              value={formData.telefone}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <Input
              label="Capacidade (kg)"
              variant="underlined"
              type="number"
              name="capacidade_kg"
              value={formData.capacidade_kg}
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
            label="Endereço Completo"
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
              Salvar Armazém
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">Armazéns Parceiros</h3>
        {loadingWarehouses ? (
          <Loading />
        ) : (
          <>
            <div className="drivers-list">
              {warehouses.map((armazem: any) => (
                <div key={armazem.id} className="driver-mini-card">
                  <div className="avatar-placeholder" style={{ width: '44px', height: '44px', borderRadius: '8px', border: 'none', background: '#f0f2f5', padding: 0, justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div className="driver-info">
                    <h4>{armazem.nome}</h4>
                    <p>{armazem.email || armazem.telefone || "Sem contato"}</p>
                  </div>
                  <span className={`status-badge ${armazem.is_ativo ? "active" : "inactive"}`} style={{ fontSize: '0.65rem' }}>
                    {armazem.is_ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
              {warehouses.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Sem registros.</p>}
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
