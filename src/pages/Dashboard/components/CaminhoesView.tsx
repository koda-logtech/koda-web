import { useState } from "react";
import { useCaminhoes, useCreateCaminhao } from "@controllers/caminhaoController";
import { useUsers } from "@controllers/userController";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import Input from "@components/common/Input";
import Select from "@components/common/Select";

interface CaminhoesViewProps {
  onViewAll: () => void;
}

export default function CaminhoesView({ onViewAll }: CaminhoesViewProps) {
  const [formData, setFormData] = useState({
    placa: "",
    modelo: "",
    marca: "",
    ano: new Date().getFullYear(),
    capacidade_kg: 0,
    id_usuario: 0,
    status: "disponivel"
  });

  // Use controllers
  const { data: trucks = [], isLoading: loadingTrucks } = useCaminhoes(1, 5);
  const { data: users = [] } = useUsers(1, 100); // For driver selection
  const createCaminhao = useCreateCaminhao();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "ano" || name === "capacidade_kg" || name === "id_usuario" ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id_usuario === 0) {
      alert("Por favor, selecione um motorista responsável.");
      return;
    }
    try {
      await createCaminhao.mutateAsync(formData);
      alert("Caminhão cadastrado com sucesso!");
      setFormData({
        placa: "",
        modelo: "",
        marca: "",
        ano: new Date().getFullYear(),
        capacidade_kg: 0,
        id_usuario: 0,
        status: "disponivel"
      });
    } catch (error) {
      console.error("Erro ao cadastrar caminhão:", error);
      alert("Erro ao cadastrar caminhão.");
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">Novo Caminhão</h3>
        
        <form className="modern-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <Input
              label="Placa"
              variant="underlined"
              name="placa"
              placeholder="ABC-1234"
              value={formData.placa}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Modelo"
              variant="underlined"
              name="modelo"
              placeholder="Ex: FH 540"
              value={formData.modelo}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <Input
              label="Marca"
              variant="underlined"
              name="marca"
              placeholder="Ex: Volvo"
              value={formData.marca}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Ano"
              variant="underlined"
              type="number"
              name="ano"
              value={formData.ano}
              onChange={handleInputChange}
              required
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
              required
            />
            <Select
              label="Status Inicial"
              variant="underlined"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: "disponivel", label: "Disponível" },
                { value: "em_rota", label: "Em Rota" },
                { value: "manutencao", label: "Manutenção" },
                { value: "inativo", label: "Inativo" }
              ]}
            />
          </div>

          <Select
            label="Motorista Responsável"
            variant="underlined"
            name="id_usuario"
            value={formData.id_usuario}
            onChange={handleInputChange}
            required
            options={[
              { value: 0, label: "Selecione um motorista..." },
              ...users.map((user: any) => ({ value: user.id, label: user.name }))
            ]}
          />

          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" variant="primary" size="medium">
              Salvar Caminhão
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">Frota Ativa</h3>
        {loadingTrucks ? (
          <Loading />
        ) : (
          <>
            <div className="drivers-list">
              {trucks.map((truck: any) => (
                <div key={truck.id} className="driver-mini-card">
                  <div className="avatar-placeholder" style={{ width: '44px', height: '44px', borderRadius: '8px', border: 'none', background: '#f0f2f5', padding: 0, justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  </div>
                  <div className="driver-info">
                    <h4>{truck.placa} - {truck.modelo}</h4>
                    <p>{truck.marca} ({truck.ano})</p>
                  </div>
                  <span className={`status-badge ${truck.status}`} style={{ fontSize: '0.65rem' }}>
                    {truck.status.replace("_", " ")}
                  </span>
                </div>
              ))}
              {trucks.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Sem registros.</p>}
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
