/**
 * Distância (em metros) entre um ponto geográfico e o LineString mais próximo
 * de uma rota desenhada (formato `[lng, lat][]`).
 *
 * Para distâncias curtas (<= ~50 km por segmento) é suficiente projetar para um
 * plano equiretangular local com escala dependente da latitude — bem mais barato
 * que rodar trig esférica completa, e com erro << 1 % nessa escala.
 */

const METERS_PER_DEG_LAT = 110_540; // ~111 km, refinado para WGS84 médio
const METERS_PER_DEG_LNG_AT_EQUATOR = 111_320;

/** Distância em metros entre um ponto e um único segmento. */
function distancePointToSegmentMeters(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const segLenSq = dx * dx + dy * dy;
  if (segLenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / segLenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Distância (m) do ponto `[lng, lat]` à polilinha `coords` (`[lng, lat][]`).
 * Retorna `Infinity` se a rota tiver menos de 2 pontos.
 */
export function pointToLineStringDistanceMeters(
  lng: number,
  lat: number,
  coords: ReadonlyArray<readonly [number, number]>,
): number {
  if (!coords || coords.length < 2) return Infinity;

  // Plano local centrado na latitude do ponto — suficiente para a vizinhança
  // imediata (a precisão cai longe, mas só queremos detectar desvio "perto da rota").
  const latRefRad = (lat * Math.PI) / 180;
  const kx = Math.cos(latRefRad) * METERS_PER_DEG_LNG_AT_EQUATOR;
  const ky = METERS_PER_DEG_LAT;

  const px = lng * kx;
  const py = lat * ky;

  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const ax = a[0] * kx;
    const ay = a[1] * ky;
    const bx = b[0] * kx;
    const by = b[1] * ky;
    const d = distancePointToSegmentMeters(px, py, ax, ay, bx, by);
    if (d < min) min = d;
  }
  return min;
}
