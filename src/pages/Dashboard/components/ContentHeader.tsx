import "./ContentHeader.css";

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function ContentHeader({ title, subtitle, actions }: ContentHeaderProps) {
  return (
    <header className="content-header">
      <div className="content-header-info">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="content-header-actions">{actions}</div>}
    </header>
  );
}
