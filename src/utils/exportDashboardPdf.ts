import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import i18n from '@/i18n';

import type { EntregaCompleta } from '@/types/models';
import { parseTemp, tempKind, entregaDesconectada } from '@/utils/dashboardOperationKpis';

export interface DashboardKpis {
  emTransito: number;
  riscoTermico: number;
  desconectados: number;
  alertasAtivos: number;
}

export interface ExportDashboardPdfOptions {
  /** Viagens ativas exibidas na lista "Monitoramento Live". */
  liveTrips: EntregaCompleta[];
  /** Todas as entregas vindas da API (para o total geral). */
  entregas: EntregaCompleta[];
  /** KPIs calculados pelo dashboard. */
  kpis: DashboardKpis;
  /** Timestamp (ms) referente ao "Dados do servidor às …" (dataUpdatedAt). */
  serverUpdatedAtMs: number;
  /** Timestamp (ms) usado como "agora" — vem do nowMs do dashboard. */
  nowMs?: number;
}

function getStatusLabels(): Record<string, string> {
  return {
    pendente: i18n.t('pdf.statusPendente', 'Pendente'),
    em_transito: i18n.t('pdf.statusEmTransito', 'Em trânsito'),
    no_armazem: i18n.t('pdf.statusNoArmazem', 'No armazém'),
    entregue: i18n.t('pdf.statusEntregue', 'Entregue'),
    cancelada: i18n.t('pdf.statusCancelada', 'Cancelada'),
  };
}

function fmtTemp(n: number | null): string {
  if (n === null) return '—';
  return `${Number.isInteger(n) ? String(n) : n.toFixed(1)}°C`;
}

function fmtFaixa(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  return `${fmtTemp(min)} / ${fmtTemp(max)}`;
}

function fmtDateTime(ms: number | null | undefined, locale: string = 'pt-BR'): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtUltimaTelemetria(iso: string | null | undefined, nowMs: number, locale: string = 'pt-BR'): string {
  if (!iso) return i18n.t('pdf.noTelemetry', 'Sem telemetria');
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return i18n.t('pdf.noTelemetry', 'Sem telemetria');
  const diffMs = Math.max(0, nowMs - t);
  const diffMin = Math.floor(diffMs / 60_000);
  const horaTexto = new Date(t).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (diffMin <= 0) return i18n.t('pdf.telemetryNow', '{{time}} (agora)', { time: horaTexto });
  if (diffMin < 60) {
    return i18n.t('pdf.telemetryMinutesAgo', '{{time}} (há {{count}} min)', { time: horaTexto, count: diffMin });
  }
  const diffH = Math.floor(diffMin / 60);
  return i18n.t('pdf.telemetryHoursAgo', '{{time}} (há {{count}}h)', { time: horaTexto, count: diffH });
}

/** Gera e baixa um PDF com a foto atual da operação. */
export function exportDashboardPdf(options: ExportDashboardPdfOptions): void {
  const { liveTrips, entregas, kpis, serverUpdatedAtMs } = options;
  const nowMs = options.nowMs ?? Date.now();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'pt-BR';
  const statusLabels = getStatusLabels();

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 36;

  // ---------- Cabeçalho ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(i18n.t('pdf.title', 'Koda — Relatório da Operação'), marginX, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(
    i18n.t('pdf.generatedAt', 'Gerado em: {{date}}', { date: fmtDateTime(nowMs, locale) }),
    marginX,
    68,
  );
  doc.text(
    i18n.t('pdf.serverDataAt', 'Dados do servidor às: {{date}}', { date: fmtDateTime(serverUpdatedAtMs, locale) }),
    marginX,
    82,
  );
  doc.text(
    i18n.t('pdf.totalDeliveries', 'Total de entregas no sistema: {{count}}', { count: entregas.length }),
    marginX,
    96,
  );

  // ---------- KPIs ----------
  let cursorY = 120;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(i18n.t('pdf.keyIndicators', 'Indicadores chave'), marginX, cursorY);
  cursorY += 10;

  const kpiCards: Array<{ label: string; value: number; color: [number, number, number] }> = [
    { label: i18n.t('pdf.kpiInTransit', 'Em trânsito'), value: kpis.emTransito, color: [52, 152, 219] },
    { label: i18n.t('pdf.kpiThermalRisk', 'Risco térmico'), value: kpis.riscoTermico, color: [241, 196, 15] },
    { label: i18n.t('pdf.kpiDisconnected', 'Desconectados'), value: kpis.desconectados, color: [231, 76, 60] },
    { label: i18n.t('pdf.kpiActiveAlerts', 'Alertas ativos'), value: kpis.alertasAtivos, color: [155, 89, 182] },
  ];

  const kpiGap = 14;
  const kpiCount = kpiCards.length;
  const kpiWidth = (pageWidth - marginX * 2 - kpiGap * (kpiCount - 1)) / kpiCount;
  const kpiHeight = 64;
  const kpiY = cursorY + 6;

  kpiCards.forEach((card, idx) => {
    const x = marginX + idx * (kpiWidth + kpiGap);
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 6, 6, 'FD');

    doc.setFillColor(...card.color);
    doc.rect(x, kpiY, 4, kpiHeight, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(card.label.toUpperCase(), x + 14, kpiY + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text(String(card.value).padStart(2, '0'), x + 14, kpiY + 50);
  });

  cursorY = kpiY + kpiHeight + 28;

  // ---------- Tabela de viagens ativas ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(
    i18n.t('pdf.liveMonitoringTitle', 'Monitoramento Live ({{count}} viagens)', { count: liveTrips.length }),
    marginX,
    cursorY,
  );

  const statusForaDaFaixa = i18n.t('pdf.thermalOutOfRange', 'Fora da faixa');
  const statusProximoLimite = i18n.t('pdf.thermalNearLimit', 'Próximo do limite');
  const statusNormal = i18n.t('pdf.thermalNormal', 'Normal');
  const statusSemLeitura = i18n.t('pdf.thermalNoReading', 'Sem leitura');
  const simText = i18n.t('pdf.yes', 'Sim');
  const naoText = i18n.t('pdf.no', 'Não');
  const semEnderecoText = i18n.t('pdf.noAddress', 'Sem endereço');

  const rows = liveTrips.map((row) => {
    const tAtual = parseTemp(row.temperatura_atual);
    const tMin = parseTemp(row.temperatura_minima);
    const tMax = parseTemp(row.temperatura_maxima);
    const tk = tempKind(tAtual, tMin, tMax);
    const desconectada = entregaDesconectada(row, nowMs);

    const placa = row.placa_caminhao?.trim() || '—';
    const modelo = row.modelo_caminhao?.trim();
    const veiculo = modelo ? `${placa} (${modelo})` : placa;
    const motorista = row.nome_motorista?.trim() || '—';
    const cliente = row.nome_cliente?.trim() || '—';
    const endereco = row.endereco_cliente?.trim() || semEnderecoText;

    let statusTemp = '—';
    if (tk === 'danger') statusTemp = statusForaDaFaixa;
    else if (tk === 'warn') statusTemp = statusProximoLimite;
    else if (tk === 'neutral') statusTemp = statusNormal;
    else if (tk === 'none') statusTemp = statusSemLeitura;

    return [
      veiculo,
      motorista,
      `${cliente}\n${endereco}`,
      statusLabels[row.status] ?? row.status,
      fmtTemp(tAtual),
      fmtFaixa(tMin, tMax),
      statusTemp,
      fmtUltimaTelemetria(row.ultima_auditoria_at, nowMs, locale),
      desconectada ? simText : naoText,
    ];
  });

  autoTable(doc, {
    startY: cursorY + 12,
    head: [[
      i18n.t('pdf.colVehicle', 'Veículo'),
      i18n.t('pdf.colDriver', 'Motorista'),
      i18n.t('pdf.colDestination', 'Destino'),
      i18n.t('pdf.colStatus', 'Status'),
      i18n.t('pdf.colCurrentTemp', 'Temp. atual'),
      i18n.t('pdf.colRange', 'Faixa (mín / máx)'),
      i18n.t('pdf.colThermalState', 'Estado térmico'),
      i18n.t('pdf.colLastTelemetry', 'Última telemetria'),
      i18n.t('pdf.colDisconnected', 'Desconectado'),
    ]],
    body: rows.length > 0 ? rows : [['—', '—', i18n.t('pdf.noActiveTrips', 'Nenhuma viagem ativa.'), '—', '—', '—', '—', '—', '—']],
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 5,
      overflow: 'linebreak',
      valign: 'middle',
      textColor: [40, 40, 40],
    },
    headStyles: {
      fillColor: [33, 47, 61],
      textColor: [240, 240, 240],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 80 },
      2: { cellWidth: 160 },
      3: { cellWidth: 60 },
      4: { cellWidth: 55, halign: 'right' },
      5: { cellWidth: 80, halign: 'right' },
      6: { cellWidth: 75 },
      7: { cellWidth: 100 },
      8: { cellWidth: 60, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      // "Desconectado" = Sim → vermelho
      if (data.column.index === 8 && data.cell.raw === simText) {
        data.cell.styles.textColor = [192, 57, 43];
        data.cell.styles.fontStyle = 'bold';
      }
      // Estado térmico → cor de acordo
      if (data.column.index === 6) {
        const v = String(data.cell.raw ?? '');
        if (v === statusForaDaFaixa) {
          data.cell.styles.textColor = [192, 57, 43];
          data.cell.styles.fontStyle = 'bold';
        } else if (v === statusProximoLimite) {
          data.cell.styles.textColor = [183, 142, 16];
        }
      }
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        i18n.t('pdf.footerNotice', 'Relatório gerado automaticamente pelo painel Koda.'),
        marginX,
        pageHeight - 18,
      );
      const pageStr = i18n.t('pdf.page', 'Página {{page}}', { page: doc.getCurrentPageInfo().pageNumber });
      doc.text(pageStr, pageWidth - marginX, pageHeight - 18, { align: 'right' });
    },
  });

  const now = new Date(nowMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const filenamePrefix = i18n.t('pdf.filenamePrefix', 'koda-relatorio');
  const filename = `${filenamePrefix}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
  doc.save(filename);
}
