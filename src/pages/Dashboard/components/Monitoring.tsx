import ContentHeader from "./ContentHeader";

export default function Monitoring() {
  return (
    <div className="dashboard-page">
      <ContentHeader 
        title="Monitoramento" 
        subtitle="Acompanhamento de ativos e fluxos em tempo real."
      />
      <div className="page-content">
        <p>Mapa ou lista de ativos ativos.</p>
      </div>
    </div>
  );
}
