import { useState, useRef } from "react";
import { useUsers, useCreateUser } from "@controllers/userController";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import Input from "@components/common/Input";

interface MotoristasViewProps {
  onViewAll: () => void;
}

export default function MotoristasView({ onViewAll }: MotoristasViewProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "driver",
    is_active: true,
    avatar_url: ""
  });

  // Use controllers
  const { data: drivers = [], isLoading: loading } = useUsers(1, 5);
  const createUser = useCreateUser();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync(formData);
      alert("Motorista cadastrado com sucesso!");
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "driver",
        is_active: true,
        avatar_url: ""
      });
      setAvatarPreview(null);
    } catch (error) {
      console.error("Erro ao cadastrar motorista:", error);
      alert("Erro ao cadastrar motorista.");
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">Novo Cadastro</h3>
        
        <form className="modern-form" onSubmit={handleSubmit}>
          {/* Avatar Upload Component */}
          <div className="avatar-upload-container">
            <div className="avatar-preview-wrapper" onClick={handleAvatarClick}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="avatar-preview" />
              ) : (
                <div className="avatar-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <span>ADICIONAR FOTO</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden-input" 
              accept="image/*" 
              onChange={handleFileChange}
            />
            <span className="upload-label">Avatar do Motorista</span>
          </div>

          <Input
            label="Nome Completo"
            variant="underlined"
            name="name"
            placeholder="Digite o nome..."
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          <div className="form-row">
            <Input
              label="Email"
              variant="underlined"
              type="email"
              name="email"
              placeholder="Ex: joao@empresa.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Telefone"
              variant="underlined"
              name="phone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <Input
              label="Senha Temporária"
              variant="underlined"
              type="password"
              name="password"
              placeholder="********"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <div className="modern-form-group">
              <label htmlFor="is_active" className="input-label-underlined">Status do Acesso</label>
              <select
                id="is_active"
                name="is_active"
                className="input-base input-underlined"
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === "true" }))}
              >
                <option value="true">Liberado (Ativo)</option>
                <option value="false">Bloqueado (Inativo)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Button type="submit" variant="primary" size="medium">
              Salvar Motorista
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">Ativos no Sistema</h3>
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="drivers-list">
              {drivers.map((driver) => (
                <div key={driver.id} className="driver-mini-card">
                  <img
                    src={driver.avatar_url || `https://ui-avatars.com/api/?name=${driver.name}&background=random`}
                    alt={driver.name}
                    className="driver-avatar"
                  />
                  <div className="driver-info">
                    <h4>{driver.name}</h4>
                    <p>{driver.email}</p>
                  </div>
                  <span className={`status-badge ${driver.is_active ? "active" : "inactive"}`} style={{ fontSize: '0.65rem' }}>
                    {driver.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
              {drivers.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Sem registros.</p>}
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
