import { useTranslation } from "react-i18next";
import "./StatusToggle.css";

interface StatusToggleProps {
  active: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  id?: string;
}

export default function StatusToggle({
  active,
  disabled = false,
  onChange,
  id,
}: StatusToggleProps) {
  const { t } = useTranslation();
  const label = active
    ? t("admin.users.statusActive", "Ativo")
    : t("admin.users.statusInactive", "Inativo");

  return (
    <button
      type="button"
      id={id}
      className={`status-toggle ${active ? "is-on" : "is-off"} ${disabled ? "is-disabled" : ""}`}
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!active)}
    >
      <span className="status-toggle-pill" aria-hidden="true">
        <span className="status-toggle-knob" />
        <span className="status-toggle-text">{label}</span>
      </span>
    </button>
  );
}
