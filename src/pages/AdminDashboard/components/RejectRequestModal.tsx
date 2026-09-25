import { useState, useEffect } from 'react';
import { AccessRequest } from '@/types/accessRequest';
import Button from '@/components/common/Button';
import './RejectRequestModal.css';

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notify: boolean) => Promise<void>;
  request: AccessRequest | null;
}

export const PRESET_REASONS = [
  'E-mail corporativo inválido ou não reconhecido',
  'Empresa sem vínculo ou cadastro ativo na plataforma',
  'Dados cadastrais inconsistentes ou incompletos',
  'Solicitação de acesso em duplicidade',
  'Outro motivo (especificar abaixo)',
];

export default function RejectRequestModal({
  isOpen,
  onClose,
  onConfirm,
  request,
}: RejectRequestModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customDetails, setCustomDetails] = useState('');
  const [notifyApplicant, setNotifyApplicant] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(PRESET_REASONS[0]);
      setCustomDetails('');
      setNotifyApplicant(true);
      setIsSubmitting(false);
      setErrorMessage(null);
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const isOther = selectedPreset === 'Outro motivo (especificar abaixo)';

  const handleConfirm = async () => {
    setErrorMessage(null);

    let finalReason = selectedPreset;
    if (isOther) {
      if (!customDetails.trim()) {
        setErrorMessage('Por favor, informe a justificativa da recusa.');
        return;
      }
      finalReason = customDetails.trim();
    } else if (customDetails.trim()) {
      finalReason = `${selectedPreset}. Obs: ${customDetails.trim()}`;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(finalReason, notifyApplicant);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao rejeitar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reject-modal-overlay" onClick={isSubmitting ? undefined : onClose}>
      <div className="reject-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="reject-modal-header">
          <div className="reject-warning-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h3>Rejeitar Solicitação de Acesso</h3>
            <p>Confirme a recusa do pedido e informe a justificativa.</p>
          </div>
        </div>

        <div className="reject-applicant-summary">
          <div className="applicant-item">
            <span className="applicant-label">Solicitante:</span>
            <span className="applicant-value">{request.nome}</span>
          </div>
          <div className="applicant-item">
            <span className="applicant-label">E-mail:</span>
            <span className="applicant-value">{request.email}</span>
          </div>
          <div className="applicant-item">
            <span className="applicant-label">Empresa / Cargo:</span>
            <span className="applicant-value">{request.empresa} &bull; {request.cargo}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="reject-error-alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="reject-form-group">
          <label htmlFor="reject-preset-select" className="reject-field-label">
            Motivo da Rejeição:
          </label>
          <select
            id="reject-preset-select"
            className="reject-select-input"
            value={selectedPreset}
            disabled={isSubmitting}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            {PRESET_REASONS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>

        <div className="reject-form-group">
          <label htmlFor="reject-details-textarea" className="reject-field-label">
            {isOther ? 'Justificativa (Obrigatória):' : 'Observações adicionais (Opcional):'}
          </label>
          <textarea
            id="reject-details-textarea"
            className="reject-textarea-input"
            rows={3}
            disabled={isSubmitting}
            placeholder={
              isOther
                ? 'Descreva claramente o motivo para constar no registro e no e-mail...'
                : 'Adicione detalhes extras para orientar o solicitante...'
            }
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
          />
        </div>

        <div className="reject-notify-toggle">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={notifyApplicant}
              disabled={isSubmitting}
              onChange={(e) => setNotifyApplicant(e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-text">
              Notificar solicitante por e-mail com o motivo
            </span>
          </label>
        </div>

        <div className="reject-modal-footer">
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={isSubmitting}
            loadingText="Rejeitando..."
            onClick={handleConfirm}
          >
            Confirmar Rejeição
          </Button>
        </div>
      </div>
    </div>
  );
}
