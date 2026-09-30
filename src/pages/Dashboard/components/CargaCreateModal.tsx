import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import { useCaminhoes, useUpdateCaminhao } from "@controllers/caminhaoController";
import { useCreateCarga } from "@controllers/cargaController";
import { useToast } from "@/contexts/ToastContext";
import type { CaminhaoCompleto } from "@/types/models";
import { formatCaminhaoOptionLabel } from "@utils/caminhaoOptionLabel";
import { getApiErrorMessage } from "@utils/helpers";

import "@components/common/ConfirmModal.css";
import "./Trips.css";

interface CargaCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function caminhoesDisponiveisParaCarga(lista: CaminhaoCompleto[]): CaminhaoCompleto[] {
  return lista.filter(
    (c) => c.status === "disponivel" && (c.id_carga == null || c.id_carga === 0),
  );
}

export default function CargaCreateModal({ isOpen, onClose }: CargaCreateModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { data: caminhoes = [] } = useCaminhoes(1, 300);
  const createCarga = useCreateCarga();
  const updateCaminhao = useUpdateCaminhao();

  const [tipo, setTipo] = useState("");
  const [tempMin, setTempMin] = useState("");
  const [tempMax, setTempMax] = useState("");
  const [latitude, setLatitude] = useState("0");
  const [longitude, setLongitude] = useState("0");
  const [idCaminhao, setIdCaminhao] = useState(0);

  const disponiveis = useMemo(
    () => caminhoesDisponiveisParaCarga(caminhoes as CaminhaoCompleto[]),
    [caminhoes],
  );

  const reset = () => {
    setTipo("");
    setTempMin("");
    setTempMax("");
    setLatitude("0");
    setLongitude("0");
    setIdCaminhao(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tVal = tipo.trim();
    if (!tVal) {
      addToast({ message: t("modals.cargaCreate.validationTipo", "Informe o tipo de carga."), type: "info" });
      return;
    }

    const min = Number.parseFloat(String(tempMin).replace(",", "."));
    const max = Number.parseFloat(String(tempMax).replace(",", "."));
    const lat = Number.parseFloat(String(latitude).replace(",", "."));
    const lng = Number.parseFloat(String(longitude).replace(",", "."));

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      addToast({ message: t("modals.cargaCreate.validationTemps", "Preencha temperaturas mínima e máxima com números válidos."), type: "info" });
      return;
    }
    if (min > max) {
      addToast({ message: t("modals.cargaCreate.validationTempRange", "A temperatura mínima não pode ser maior que a máxima."), type: "info" });
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      addToast({ message: t("modals.cargaCreate.validationCoords", "Latitude e longitude devem ser números válidos."), type: "info" });
      return;
    }

    const temperaturaAtual = (min + max) / 2;

    const saving = createCarga.isPending || updateCaminhao.isPending;
    if (saving) return;

    try {
      const created = await createCarga.mutateAsync({
        tipo: tVal,
        temperatura_minima: min,
        temperatura_maxima: max,
        temperatura_atual: temperaturaAtual,
        latitude: lat,
        longitude: lng,
      });

      const idCarga = created?.id != null ? Number(created.id) : NaN;
      if (!Number.isFinite(idCarga)) {
        addToast({
          message:
            t("modals.cargaCreate.invalidIdError", "Carga criada, mas a API não retornou um ID válido; não foi possível vincular ao caminhão."),
          type: "error",
        });
        handleClose();
        return;
      }

      if (idCaminhao) {
        try {
          await updateCaminhao.mutateAsync({
            id: idCaminhao,
            payload: {
              id_carga: idCarga,
              status: "em_espera",
            },
          });
        } catch (err) {
          addToast({
            message: `${t("modals.cargaCreate.linkError", "Carga criada, mas não foi possível vincular ao caminhão:")} ${getApiErrorMessage(err)}`,
            type: "error",
          });
          handleClose();
          return;
        }
      }

      addToast({ message: t("modals.cargaCreate.createSuccess", "Carga criada com sucesso."), type: "success" });
      handleClose();
    } catch (err) {
      addToast({
        message: `${t("modals.cargaCreate.createError", "Não foi possível criar a carga.")} ${getApiErrorMessage(err)}`,
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  const saving = createCarga.isPending || updateCaminhao.isPending;

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
        aria-labelledby="carga-modal-title"
      >
        <div className="trips-modal-head">
          <h3 id="carga-modal-title">{t("modals.cargaCreate.title", "Nova carga")}</h3>
          <p>
            {t("modals.cargaCreate.subtitleDesc", "Defina tipo, faixa de temperatura e localização. A leitura atual virá do sensor quando houver. Opcionalmente vincule a um caminhão")}{" "}
            <strong>{t("modals.cargaCreate.subtitleAvailable", "disponível")}</strong>
            {t("modals.cargaCreate.subtitleSuffix", " — o veículo passará a constar como em espera com esta carga.")}
          </p>
        </div>

        <form className="trips-modal-form" onSubmit={handleSubmit}>
          <Input
            label={t("modals.cargaCreate.tipoLabel", "Tipo de carga")}
            variant="underlined"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder={t("modals.cargaCreate.tipoPlaceholder", "Ex.: refrigerada, seca, frigorífica...")}
          />

          <div className="trips-modal-form-row">
            <Input
              label={t("modals.cargaCreate.tempMinLabel", "Temp. mínima (°C)")}
              variant="underlined"
              name="tempMin"
              type="text"
              inputMode="decimal"
              value={tempMin}
              onChange={(e) => setTempMin(e.target.value)}
            />
            <Input
              label={t("modals.cargaCreate.tempMaxLabel", "Temp. máxima (°C)")}
              variant="underlined"
              name="tempMax"
              type="text"
              inputMode="decimal"
              value={tempMax}
              onChange={(e) => setTempMax(e.target.value)}
            />
          </div>

          <div className="trips-modal-form-row">
            <Input
              label={t("modals.cargaCreate.latitudeLabel", "Latitude")}
              variant="underlined"
              name="latitude"
              type="text"
              inputMode="decimal"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <Input
              label={t("modals.cargaCreate.longitudeLabel", "Longitude")}
              variant="underlined"
              name="longitude"
              type="text"
              inputMode="decimal"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>

          <Select
            label={t("modals.cargaCreate.truckLabel", "Caminhão (opcional)")}
            variant="underlined"
            name="idCaminhao"
            value={idCaminhao}
            onChange={(e) => setIdCaminhao(Number(e.target.value))}
            options={[
              { value: 0, label: t("modals.cargaCreate.truckNone", "Sem vínculo") },
              ...disponiveis.map((c) => ({
                value: c.id,
                label: formatCaminhaoOptionLabel(c),
              })),
            ]}
          />

          <div className="trips-modal-actions">
            <Button type="button" variant="secondary" size="medium" onClick={handleClose}>
              {t("modals.cargaCreate.cancel", "Cancelar")}
            </Button>
            <Button type="submit" variant="primary" size="medium" disabled={saving}>
              {saving ? t("modals.cargaCreate.saving", "Salvando...") : t("modals.cargaCreate.createButton", "Criar carga")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
