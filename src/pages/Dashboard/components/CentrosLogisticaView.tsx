import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      addToast({ message: t("management.centrosView.createSuccess", "Centro logístico cadastrado com sucesso!"), type: "success" });
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
      addToast({ message: t("management.centrosView.createError", "Erro ao cadastrar centro logístico."), type: "error" });
    }
  };

  return (
    <div className="motoristas-section">
      <div className="motoristas-left">
        <h3 className="section-subtitle">{t("management.centrosView.newCenterTitle", "Novo Centro Logístico")}</h3>

        <form className="modern-form" onSubmit={handleSubmit}>
          <Input
            label={t("management.centrosView.nomeLabel", "Nome da unidade")}
            variant="underlined"
            name="nome"
            placeholder={t("management.centrosView.nomePlaceholder", "Ex: CD São Paulo – Zona Sul")}
            value={formData.nome}
            onChange={handleInputChange}
            required
          />

          <div className="form-row">
            <Input
              label={t("management.centrosView.phoneLabel", "Telefone")}
              variant="underlined"
              name="telefone"
              placeholder={t("management.centrosView.phonePlaceholder", "(00) 0000-0000")}
              value={formData.telefone}
              onChange={handleInputChange}
            />
            <Select
              label={t("management.centrosView.statusLabel", "Status")}
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
                { value: "true", label: t("management.centrosView.statusActive", "Ativo") },
                { value: "false", label: t("management.centrosView.statusInactive", "Inativo") },
              ]}
            />
          </div>

          <Input
            label={t("management.centrosView.addressLabel", "Endereço completo")}
            variant="underlined"
            name="endereco"
            placeholder={t("management.centrosView.addressPlaceholder", "Rua, número, bairro, cidade – UF")}
            value={formData.endereco}
            onChange={handleInputChange}
          />

          <div className="form-row">
            <Input
              label={t("management.centrosView.latitudeLabel", "Latitude")}
              variant="underlined"
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
            />
            <Input
              label={t("management.centrosView.longitudeLabel", "Longitude")}
              variant="underlined"
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Button type="submit" variant="primary" size="medium">
              {t("management.centrosView.submitButton", "Salvar Centro Logístico")}
            </Button>
          </div>
        </form>
      </div>

      <div className="motoristas-right">
        <h3 className="section-subtitle">{t("management.centrosView.listTitle", "Centros cadastrados")}</h3>
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
                    <p>{centro.telefone || centro.endereco || t("management.centrosView.noContact", "Sem contato")}</p>
                  </div>
                  <span
                    className={`status-badge ${centro.is_ativo ? "active" : "inactive"}`}
                    style={{ fontSize: "0.65rem" }}
                  >
                    {centro.is_ativo ? t("management.centrosView.statusActive", "Ativo") : t("management.centrosView.statusInactive", "Inativo")}
                  </span>
                </div>
              ))}
              {centros.length === 0 && (
                <p style={{ textAlign: "center", color: "#999" }}>{t("management.centrosView.noRecords", "Sem registros.")}</p>
              )}
            </div>

            <div className="view-all-container">
              <button className="btn-text" onClick={onViewAll}>
                {t("management.centrosView.viewAll", "Listagem Completa →")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
