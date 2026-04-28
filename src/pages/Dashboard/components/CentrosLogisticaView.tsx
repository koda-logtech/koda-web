import { useState } from "react";
import {
  useCentrosLogistica,
  useCreateCentroLogistica,
} from "@controllers/centroLogisticaController";
import { useToast } from "@/contexts/ToastContext";

import Button from "@components/common/Button";
import Loading from "@components/common/Loading";
import Input from "@components/common/Input";
import Select from "@components/common/Select";

interface CentrosLogisticaViewProps {
  onViewAll: () => void;
}

export default function CentrosLogisticaView({ onViewAll }: CentrosLogisticaViewProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    telefone: "",
    latitude: 0,
    longitude: 0,
    is_ativo: true,
  });

  const { data: centros = [], isLoading: loadingCentros } = useCentrosLogistica(1, 5);
  const createCentro = useCreateCentroLogistica();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "latitude" || name === "longitude" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCentro.mutateAsync(formData);
      addToast({ message: "Centro logístico cadastrado com sucesso!", type: "success" });
      setFormData({
        nome: "",
        endereco: "",
        telefone: "",
        latitude: 0,
        longitude: 0,
        is_ativo: true,
      });
    } catch (error) {
      console.error("Erro ao cadastrar centro logístico:", error);
      addToast({ message: "Erro ao cadastrar centro logístico.", type: "error" });
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">Novo Centro Logístico</h3>

        <form className="modern-form" onSubmit={handleSubmit}>
          <Input
            label="Nome da unidade"
            variant="underlined"
            name="nome"
            placeholder="Ex: CD São Paulo – Zona Sul"
            value={formData.nome}
            onChange={handleInputChange}
            required
          />

          <div className="form-row">
            <Input
              label="Telefone"
              variant="underlined"
              name="telefone"
              placeholder="(00) 0000-0000"
              value={formData.telefone}
              onChange={handleInputChange}
            />
            <Select
              label="Status"
              variant="underlined"
              name="is_ativo"
              value={formData.is_ativo ? "true" : "false"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_ativo: e.target.value === "true",
                }))
              }
              options={[
                { value: "true", label: "Ativo" },
                { value: "false", label: "Inativo" },
              ]}
            />
          </div>

          <Input
            label="Endereço completo"
            variant="underlined"
            name="endereco"
            placeholder="Rua, número, bairro, cidade – UF"
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

          <div style={{ marginTop: "1rem" }}>
            <Button type="submit" variant="primary" size="medium">
              Salvar Centro Logístico
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">Centros cadastrados</h3>
        {loadingCentros ? (
          <Loading />
        ) : (
          <>
            <div className="drivers-list">
              {centros.map((centro: any) => (
                <div key={centro.id} className="driver-mini-card">
                  <div
                    className="avatar-placeholder"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#f0f2f5",
                      padding: 0,
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="5" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                      <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                  </div>
                  <div className="driver-info">
                    <h4>{centro.nome}</h4>
                    <p>{centro.telefone || centro.endereco || "Sem contato"}</p>
                  </div>
                  <span
                    className={`status-badge ${centro.is_ativo ? "active" : "inactive"}`}
                    style={{ fontSize: "0.65rem" }}
                  >
                    {centro.is_ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
              {centros.length === 0 && (
                <p style={{ textAlign: "center", color: "#999" }}>Sem registros.</p>
              )}
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
