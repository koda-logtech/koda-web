import type { CaminhaoCompleto } from "@/types/models";

/** Veículo com · entre marca/modelo/placa; motorista separado por │. */
export function formatCaminhaoOptionLabel(c: CaminhaoCompleto): string {
  const marca = c.marca?.trim() ?? "";
  const modelo = c.modelo?.trim() ?? "";
  const placa = c.placa?.trim() || "—";
  const nomeVeiculo = [marca, modelo].filter(Boolean).join(" ");
  const veiculo = nomeVeiculo ? `${nomeVeiculo} · ${placa}` : placa;
  const mot = c.nome_motorista?.trim();
  return mot ? `${veiculo}  │  ${mot}` : `${veiculo}  │  —`;
}
