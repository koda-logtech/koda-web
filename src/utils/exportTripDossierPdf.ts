import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import i18n from '@/i18n';
import type { CargaAlerta, CargaTelemetriaAuditoria, EntregaCompleta } from '@/types/models';
import {
  buildFreightIdentifier,
  computeTelemetryStats,
  formatTimestampForFilename,
  parseTelemetryNumber,
  resolveComplianceStatus,
} from './tripDossierHelpers';

export interface ExportTripDossierPdfOptions {
  entrega: EntregaCompleta;
  pings: CargaTelemetriaAuditoria[];
  alertas: CargaAlerta[];
  generatedAtMs?: number;
}

function fmtDateTime(isoOrMs: string | number, locale: string): string {
  const ms = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function fmtTemp(n: number | null): string {
  if (n === null) return '—';
  return `${Number.isInteger(n) ? String(n) : n.toFixed(1)}°C`;
}

function fmtFaixa(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  return `[${fmtTemp(min)}, ${fmtTemp(max)}]`;
}

function alertStatusLabel(status: CargaAlerta['status']): string {
  if (status === 'aberto') return i18n.t('alertas.statusOpen', 'Aberto');
  if (status === 'resolvido') return i18n.t('alertas.statusResolved', 'Resolvido');
  return i18n.t('alertas.statusCanceled', 'Cancelado');
}

function alertTipoLabel(tipo: CargaAlerta['tipo']): string {
  return tipo === 'alta'
    ? i18n.t('alertas.highTempBadge', 'Temp. alta')
    : i18n.t('alertas.lowTempBadge', 'Temp. baixa');
}

function sortPingsAsc(pings: CargaTelemetriaAuditoria[]): CargaTelemetriaAuditoria[] {
  return [...pings].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id,
  );
}

/** Gera e baixa o dossiê auditável de viagem em PDF. */
export function exportTripDossierPdf(options: ExportTripDossierPdfOptions): void {
  const { entrega, pings, alertas } = options;
  const nowMs = options.generatedAtMs ?? Date.now();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'pt-BR';
  const marginX = 40;
  const sortedPings = sortPingsAsc(pings);

  const tMin = parseTelemetryNumber(entrega.temperatura_minima);
  const tMax = parseTelemetryNumber(entrega.temperatura_maxima);
  const stats = computeTelemetryStats(sortedPings, tMin, tMax);
  const compliance = resolveComplianceStatus(stats, alertas);
  const statusConforme = i18n.t('tripDossierPdf.statusConforme', 'Conforme');
  const statusRisco = i18n.t('tripDossierPdf.statusRisk', 'Risco Térmico Detectado');
  const statusLabel = compliance === 'conforme' ? statusConforme : statusRisco;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(i18n.t('tripDossierPdf.title', 'Koda — Dossiê Auditável de Viagem'), marginX, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(
    i18n.t('tripDossierPdf.generatedAt', 'Gerado em: {{date}}', {
      date: fmtDateTime(nowMs, locale),
    }),
    marginX,
    64,
  );
  doc.text(buildFreightIdentifier(entrega), marginX, 78);

  const motorista = entrega.nome_motorista?.trim() || '—';
  const placa = entrega.placa_caminhao?.trim() || '—';
  const cliente = entrega.nome_cliente?.trim() || '—';
  const endereco = entrega.endereco_cliente?.trim();
  const destino = endereco ? `${cliente}\n${endereco}` : cliente;

  autoTable(doc, {
    startY: 92,
    head: [[i18n.t('tripDossierPdf.consolidatedTitle', 'Dados consolidados da viagem')]],
    body: [
      [
        i18n.t('pdf.colDriver', 'Motorista'),
        i18n.t('tripDossierPdf.colPlate', 'Placa do caminhão'),
        i18n.t('tripDossierPdf.colDestinationClient', 'Cliente de destino'),
        i18n.t('tripDossierPdf.colThermalLimits', 'Limites térmicos'),
      ],
      [motorista, placa, destino, fmtFaixa(tMin, tMax)],
    ],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
    headStyles: {
      fillColor: [33, 47, 61],
      textColor: [240, 240, 240],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    didDrawPage: drawFooter(doc, marginX, pageWidth),
  });

  const afterConsolidated = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY ?? 180;

  autoTable(doc, {
    startY: afterConsolidated + 16,
    head: [[i18n.t('tripDossierPdf.complianceSummary', 'Resumo de conformidade')]],
    body: [
      [
        i18n.t('tripDossierPdf.totalPings', 'Total de pings'),
        i18n.t('tripDossierPdf.minTempRecorded', 'Temperatura mínima registrada'),
        i18n.t('tripDossierPdf.maxTempRecorded', 'Temperatura máxima registrada'),
        i18n.t('tripDossierPdf.finalStatus', 'Status final'),
      ],
      [
        String(stats.totalPings),
        fmtTemp(stats.tempMin),
        fmtTemp(stats.tempMax),
        statusLabel,
      ],
    ],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
    headStyles: {
      fillColor: [33, 47, 61],
      textColor: [240, 240, 240],
      fontStyle: 'bold',
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 3) return;
      if (String(data.cell.raw) === statusRisco) {
        data.cell.styles.textColor = [192, 57, 43];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: drawFooter(doc, marginX, pageWidth),
  });

  const afterSummary = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY ?? 260;

  const pingRows =
    sortedPings.length > 0
      ? sortedPings.map((row) => {
          const temp = parseTelemetryNumber(row.temperatura);
          const lat = parseTelemetryNumber(row.latitude);
          const lon = parseTelemetryNumber(row.longitude);
          return [
            fmtDateTime(row.created_at, locale),
            temp === null ? '—' : fmtTemp(temp),
            lat === null ? '—' : lat.toFixed(5),
            lon === null ? '—' : lon.toFixed(5),
            `#${row.id}`,
          ];
        })
      : [
          [
            i18n.t('tripDossierPdf.noPings', 'Nenhum ping de telemetria registado para esta carga.'),
            '—',
            '—',
            '—',
            '—',
          ],
        ];

  autoTable(doc, {
    startY: afterSummary + 16,
    head: [
      [
        i18n.t('tripDossierPdf.pingsSection', 'Pings de auditoria'),
      ],
    ],
    body: [],
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [33, 47, 61], textColor: [240, 240, 240], fontStyle: 'bold' },
    didDrawPage: drawFooter(doc, marginX, pageWidth),
  });

  const pingsTableStart =
    ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? afterSummary) + 4;

  autoTable(doc, {
    startY: pingsTableStart,
    head: [[
      i18n.t('audit.tableDate', 'Data / hora'),
      i18n.t('audit.tableTemp', 'Temperatura'),
      i18n.t('audit.tableLat', 'Latitude'),
      i18n.t('audit.tableLon', 'Longitude'),
      i18n.t('audit.tableRecordId', 'Id registo'),
    ]],
    body: pingRows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: [240, 240, 240],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    didDrawPage: drawFooter(doc, marginX, pageWidth),
  });

  const afterPings = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 400;

  const alertRows =
    alertas.length > 0
      ? alertas.map((a) => [
          alertStatusLabel(a.status),
          alertTipoLabel(a.tipo),
          fmtDateTime(a.aberto_at, locale),
          a.resolvido_at ? fmtDateTime(a.resolvido_at, locale) : '—',
          fmtTemp(parseTelemetryNumber(a.temperatura_pico)),
          String(a.qtd_pings),
        ])
      : [
          [
            i18n.t(
              'tripDossierPdf.noAlerts',
              'Nenhum alerta térmico registado nesta viagem.',
            ),
            '—',
            '—',
            '—',
            '—',
            '—',
          ],
        ];

  autoTable(doc, {
    startY: afterPings + 20,
    head: [[i18n.t('tripDossierPdf.contingencyLog', 'Log de contingências (alertas térmicos)')]],
    body: [],
    headStyles: { fillColor: [33, 47, 61], textColor: [240, 240, 240], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9 },
    didDrawPage: drawFooter(doc, marginX, pageWidth),
  });

  const alertsStart =
    ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? afterPings) + 4;

  autoTable(doc, {
    startY: alertsStart,
    head: [[
      i18n.t('alertas.status', 'Status'),
      i18n.t('alertas.type', 'Tipo'),
      i18n.t('alertas.openedAt', 'Aberto em'),
      i18n.t('alertas.resolvedAt', 'Resolvido em'),
      i18n.t('tripDossierPdf.peakTemp', 'Temp. pico'),
      i18n.t('alertas.pings', 'Pings'),
    ]],
    body: alertRows,
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 4 },
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: [240, 240, 240],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 249, 251] },
    didDrawPage: drawFooter(doc, marginX, pageWidth),
  });

  const prefix = i18n.t('tripDossierPdf.filenamePrefix', 'koda-dossie-viagem');
  const idCarga = entrega.id_carga ?? entrega.id;
  const filename = `${prefix}-${idCarga}-${formatTimestampForFilename(nowMs)}.pdf`;
  doc.save(filename);
}

function drawFooter(doc: jsPDF, marginX: number, pageWidth: number) {
  return () => {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      i18n.t(
        'tripDossierPdf.footerNotice',
        'Dossiê gerado automaticamente pelo painel Koda para fins de auditoria.',
      ),
      marginX,
      pageHeight - 18,
    );
    const pageStr = i18n.t('pdf.page', 'Página {{page}}', {
      page: doc.getCurrentPageInfo().pageNumber,
    });
    doc.text(pageStr, pageWidth - marginX, pageHeight - 18, { align: 'right' });
  };
}
