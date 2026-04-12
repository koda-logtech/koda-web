# 📦 Koda: Resiliência em Cadeia de Frio

O **Koda** é uma solução de LogTech (Logistics Technology) projetada para eliminar o desperdício no transporte de cargas sensíveis. Através do uso de **Inteligência de Borda (Edge AI)** e sistemas de monitoramento em tempo real, o Koda transforma o transporte passivo em um sistema ativo de proteção de carga.

---

## 🎯 Visão e Propósito

### O Problema do Setor
Atualmente, a logística de cadeia de frio enfrenta três grandes desafios:
1.  **Desperdício:** Milhões de reais em alimentos e medicamentos são perdidos anualmente devido a quebras térmicas não detectadas a tempo.
2.  **Inércia Tecnológica:** A maioria dos rastreadores atuais apenas reporta o dano após ele ter ocorrido, sem capacidade de ação preventiva.
3.  **Falta de Transparência:** Existe uma carência de dados auditáveis e em tempo real sobre a integridade do produto final.

### Nossa Proposta de Valor
O Koda inverte essa lógica:
*   **Why (Por quê):** Garantir que produtos essenciais (medicamentos e alimentos) cheguem ao seu destino com 100% de eficácia e segurança.
*   **How (Como):** Antecipando falhas térmicas através de sensores IoT inteligentes e calculando automaticamente rotas de contingência para o ponto de apoio mais próximo.
*   **What (O quê):** Um ecossistema integrado composto por hardware embarcado, dashboard web administrativo e inteligência de decisão local.

---

## 🎨 Funcionalidades do Dashboard (Koda Central)

O frontend web (`koda-web`) atua como a central de comando para gestores de frota:

### 🟠 Monitoramento e Gestão
- **Dashboard Consolidado:** Visão macro da operação (veículos em trânsito, alertas críticos, status da frota).
- **Mapa em Tempo Real:** Visualização geográfica de todos os veículos integrados com Leaflet/Google Maps.
- **Gráficos de Telemetria:** Acompanhamento histórico e em tempo real da temperatura da carga versus o tempo de viagem.

### 🛠 Operação e CRUDs
- **Gestão de Frota:** Cadastro e manutenção de caminhões, motoristas e dispositivos IoT.
- **Controle de PDAs:** Gestão de Pontos de Apoio (transbordo) com geolocalização para rotas de emergência.
- **Relatórios:** Exportação de dados de conformidade térmica em formatos PDF e CSV para auditoria.

---

## 🏗️ Arquitetura Técnica

O projeto utiliza uma stack moderna focada em escalabilidade e tempo real:

*   **Linguagem & Framework:** React.js com TypeScript para garantir robustez no código.
*   **Estilização:** Tailwind CSS para uma interface moderna e responsiva.
*   **Banco de Dados & Realtime:** Supabase (PostgreSQL) para persistência e Supabase Realtime para atualizações instantâneas no dashboard sem necessidade de refresh.
*   **Comunicação:** Integração com `koda-server` via REST API (Axios) e protocolo MQTT para dados de telemetria.
*   **Hardware:** MicroPython/C++ rodando em ESP32, atuando na borda com lógica de decisão local.

---

## 📊 Estrutura de Dados Principal

| Entidade | Função no Ecossistema |
| :--- | :--- |
| **Usuário** | Gerencia acessos (Admin, Gestor, Motorista) e segurança via JWT. |
| **Carga** | Define os parâmetros vitais (ex: range térmico de -22°C a -18°C). |
| **Caminhão** | O nó físico que transporta a carga e o hardware de monitoramento. |
| **Entrega** | O ciclo de vida de uma viagem, vinculando origem, destino, motorista e status. |
| **Telemetria** | A trilha digital ininterrupta de temperatura, umidade e posição GPS. |

---

## 🚀 Diferenciais Competitivos

1.  **Decisão na Borda (Edge Intelligence):** O hardware Koda é capaz de identificar uma tendência de aquecimento e sugerir uma rota de fuga mesmo se perder a conexão com a internet.
2.  **Transbordo Ativo:** O sistema não apenas alerta, mas sugere proativamente o ponto de apoio ideal baseado no tempo de vida útil restante da carga (gradiente térmico).
3.  **Auditoria Confiável:** Todos os registros são gravados de forma sequencial e protegida, garantindo que os dados térmicos apresentados sejam fidedignos.

---
*Este documento é a "fonte da verdade" para a visão do produto. Última atualização: Abril/2026.*
