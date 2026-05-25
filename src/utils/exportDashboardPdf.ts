import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_transito: 'Em trânsito',
  no_armazem: 'No armazém',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

function fmtTemp(n: number | null): string {
  if (n === null) return '—';
  return `${Number.isInteger(n) ? String(n) : n.toFixed(1)}°C`;
}

function fmtFaixa(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  return `${fmtTemp(min)} / ${fmtTemp(max)}`;
}

function fmtDateTime(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtUltimaTelemetria(iso: string | null | undefined, nowMs: number): string {
  if (!iso) return 'Sem telemetria';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'Sem telemetria';
  const diffMs = Math.max(0, nowMs - t);
  const diffMin = Math.floor(diffMs / 60_000);
  const horaTexto = new Date(t).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (diffMin <= 0) return `${horaTexto} (agora)`;
  if (diffMin < 60) return `${horaTexto} (há ${diffMin} min)`;
  const diffH = Math.floor(diffMin / 60);
  return `${horaTexto} (há ${diffH}h)`;
}

/** Gera e baixa um PDF com a foto atual da operação. */
export function exportDashboardPdf(options: ExportDashboardPdfOptions): void {
  const { liveTrips, entregas, kpis, serverUpdatedAtMs } = options;
  const nowMs = options.nowMs ?? Date.now();

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 36;

  // ---------- Cabeçalho ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text('Koda — Relatório da Operação', marginX, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Gerado em: ${fmtDateTime(nowMs)}`, marginX, 68);
  doc.text(`Dados do servidor às: ${fmtDateTime(serverUpdatedAtMs)}`, marginX, 82);
  doc.text(`Total de entregas no sistema: ${entregas.length}`, marginX, 96);

  // ---------- KPIs ----------
  let cursorY = 120;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text('Indicadores chave', marginX, cursorY);
  cursorY += 10;

  const kpiCards: Array<{ label: string; value: number; color: [number, number, number] }> = [
    { label: 'Em trânsito', value: kpis.emTransito, color: [52, 152, 219] },
    { label: 'Risco térmico', value: kpis.riscoTermico, color: [241, 196, 15] },
    { label: 'Desconectados', value: kpis.desconectados, color: [231, 76, 60] },
    { label: 'Alertas ativos', value: kpis.alertasAtivos, color: [155, 89, 182] },
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
  doc.text(`Monitoramento Live (${liveTrips.length} viagens)`, marginX, cursorY);

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
    const endereco = row.endereco_cliente?.trim() || 'Sem endereço';

    let statusTemp = '—';
    if (tk === 'danger') statusTemp = 'Fora da faixa';
    else if (tk === 'warn') statusTemp = 'Próximo do limite';
    else if (tk === 'neutral') statusTemp = 'Normal';
    else if (tk === 'none') statusTemp = 'Sem leitura';

    return [
      veiculo,
      motorista,
      `${cliente}\n${endereco}`,
      STATUS_LABELS[row.status] ?? row.status,
      fmtTemp(tAtual),
      fmtFaixa(tMin, tMax),
      statusTemp,
      fmtUltimaTelemetria(row.ultima_auditoria_at, nowMs),
      desconectada ? 'Sim' : 'Não',
    ];
  });

  autoTable(doc, {
    startY: cursorY + 12,
    head: [[
      'Veículo',
      'Motorista',
      'Destino',
      'Status',
      'Temp. atual',
      'Faixa (mín / máx)',
      'Estado térmico',
      'Última telemetria',
      'Desconectado',
    ]],
    body: rows.length > 0 ? rows : [['—', '—', 'Nenhuma viagem ativa.', '—', '—', '—', '—', '—', '—']],
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
      if (data.column.index === 8 && data.cell.raw === 'Sim') {
        data.cell.styles.textColor = [192, 57, 43];
        data.cell.styles.fontStyle = 'bold';
      }
      // Estado térmico → cor de acordo
      if (data.column.index === 6) {
        const v = String(data.cell.raw ?? '');
        if (v === 'Fora da faixa') {
          data.cell.styles.textColor = [192, 57, 43];
          data.cell.styles.fontStyle = 'bold';
        } else if (v === 'Próximo do limite') {
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
        'Relatório gerado automaticamente pelo painel Koda.',
        marginX,
        pageHeight - 18,
      );
      const pageStr = `Página ${doc.getCurrentPageInfo().pageNumber}`;
      doc.text(pageStr, pageWidth - marginX, pageHeight - 18, { align: 'right' });
    },
  });

  const now = new Date(nowMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const filename = `koda-relatorio-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
  doc.save(filename);
}
