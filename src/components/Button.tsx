interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  children,
  ...props
}: ButtonProps) {
  const className = `btn btn-${variant} btn-${size} ${loading ? "loading" : ""}`;

  return (
    <button className={className} disabled={disabled || loading} {...props}>
      {loading ? "Carregando..." : children}
    </button>
  );
}
