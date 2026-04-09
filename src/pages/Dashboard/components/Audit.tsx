import ContentHeader from "./ContentHeader";

export default function Audit() {
  return (
    <div className="dashboard-page">
      <ContentHeader 
        title="Auditoria" 
        subtitle="Logs de sistema, segurança e conformidade."
      />
      <div className="page-content">
        <p>Relatórios detalhados de auditoria.</p>
      </div>
    </div>
  );
}
