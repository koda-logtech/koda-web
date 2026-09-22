interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  loadingText,
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  const className = `btn btn-${variant} btn-${size} ${loading ? "loading" : ""}`;

  return (
    <button className={className} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="btn-loading-content">
          <svg
            className="btn-spinner"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span>{loadingText || "Carregando..."}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
