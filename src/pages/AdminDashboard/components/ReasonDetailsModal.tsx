import { AccessRequest } from '@/types/accessRequest';
import Button from '@/components/common/Button';
import './ReasonDetailsModal.css';

interface ReasonDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AccessRequest | null;
}

export default function ReasonDetailsModal({ isOpen, onClose, request }: ReasonDetailsModalProps) {
  if (!isOpen || !request) return null;

  const reason = request.rejectionReason || request.rejection_reason || 'Nenhum motivo detalhado foi registrado.';

  return (
    <div className="reason-modal-overlay" onClick={onClose}>
      <div className="reason-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="reason-modal-header">
          <div className="reason-icon-circle">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3>Motivo da Recusa</h3>
            <p className="reason-applicant-info">
              {request.nome} &bull; {request.email}
            </p>
          </div>
        </div>

        <div className="reason-modal-body">
          <div className="reason-callout">
            <p className="reason-content-text">{reason}</p>
          </div>
        </div>

        <div className="reason-modal-footer">
          <Button variant="secondary" size="small" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
