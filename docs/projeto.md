# 📦 Koda: Resiliência em Cadeia de Frio

O **Koda** é uma solução de LogTech focada em eliminar o desperdício no transporte de cargas sensíveis através de **Inteligência de Borda (Edge AI)** e roteamento de emergência em tempo real.

---

## 🎯 Visão e Propósito

### O Problema
*   **Desperdício:** Perda massiva de alimentos e medicamentos por quebra térmica.
*   **Inércia:** Rastreadores atuais apenas relatam o dano, não agem para evitá-lo.
*   **Risco Sanitário:** Falta de auditoria confiável sobre a integridade do produto final.

### O Círculo Dourado
*   **Why:** Garantir que medicamentos e alimentos cheguem com 100% de eficácia ao destino.
*   **How:** Antecipando falhas térmicas via IoT e calculando rotas de transbordo automáticas.
*   **What:** Um ecossistema integrado de hardware e dashboard web para gestão de frota.

---

## 🎨 Requisitos de Interface (Frontend Web)

### 🟠 Koda Central (Dashboard Web)
*   **RF-WEB-01:** Autenticação via koda-server (JWT).
*   **RF-WEB-02:** Dashboard com visão consolidada: total de caminhões, alertas ativos e veículos offline.
*   **RF-WEB-03:** Listagem de frota com busca por placa, filtros de status e paginação.
*   **RF-WEB-04:** Atualização de temperatura em tempo real via Supabase Realtime (sem refresh).
*   **RF-WEB-05:** Formulários CRUD para gestão de Motoristas, Veículos e Dispositivos IoT.
*   **RF-WEB-06:** Visualização de Gráficos de Temperatura (Histórico vs. Tempo).
*   **RF-WEB-07:** Monitoramento via Mapa (Leaflet/Google Maps) com última posição GPS.
*   **RF-WEB-08:** Gestão de PDAs (Pontos de Apoio/Transbordo) com coordenadas geográficas.
*   **RF-WEB-09:** Controle operacional para encerramento manual de rotas críticas.
*   **RF-WEB-10:** Exportação de relatórios de conformidade térmica em PDF e CSV.
*   **RF-WEB-11:** Monitoramento do status da Entrega (Pendente, Em Trânsito, Incidente).

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológica
*   **Cloud & DB:** Supabase (PostgreSQL + Realtime).
*   **Backend:** Node.js (Express + TypeScript) + koda-server + MQTT Broker.
*   **Frontend:** React.js (Web) + Tailwind CSS.
*   **Hardware:** MicroPython / C++ (Esp32 ou similar).

### Inteligência de Resiliência
O sistema calcula continuamente a viabilidade da carga baseado no gradiente de aquecimento:

```python
# Lógica do Motor de Decisão
tempo_restante = (temperatura_limite - temperatura_atual) / gradiente_aquecimento

if tempo_restante < tempo_para_ponto_apoio_proximo:
    disparar_alerta_e_rota_contingencia()
```

---

## 📊 Modelo de Dados (Core)

| Entidade | Responsabilidade |
| :--- | :--- |
| **Usuário** | Perfis de Admin, Gestor e Motorista. |
| **Carga** | Define limites térmicos (ex: -18°C a -22°C). |
| **Caminhão** | Vincula hardware (MAC Address) e motorista. |
| **Entrega** | Consolida rota, cliente e status em tempo real. |
| **Telemetria** | Séries temporais de temperatura e GPS (Auditável). |

---

## 🚀 Diferenciais Competitivos

1.  **Auditoria Imutável:** Registros térmicos protegidos contra manipulação.
2.  **Edge Intelligence:** O hardware toma decisões básicas mesmo sem internet.
3.  **Transbordo Ativo:** Sugere o ponto de apoio mais próximo *antes* da carga estragar.

---
*Documentação em constante evolução. Última atualização: Abril/2026.*
