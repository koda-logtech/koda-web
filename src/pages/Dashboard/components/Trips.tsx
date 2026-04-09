import ContentHeader from "./ContentHeader";
import Button from "@components/common/Button";

export default function Trips() {
  return (
    <div className="dashboard-page">
      <ContentHeader 
        title="Viagens" 
        subtitle="Gerenciamento e histórico de rotas logísticas."
        actions={<Button variant="primary" size="small">+ Nova Viagem</Button>}
      />
      <div className="page-content">
        <p>Tabela de viagens e status de rotas.</p>
      </div>
    </div>
  );
}
