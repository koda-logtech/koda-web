import { expect, type Locator, type Page } from "@playwright/test";
import { DashboardPage } from "../pages/dashboard.page";
import { clickClear } from "./alerts";
import { pickCustomSelect, readCustomOptions, realCustomOptions } from "./select";

export interface OperacaoCriada {
  tipo: string;
  plate: string;
  clientName: string;
  notes: string;
}

const TRUCK_LABEL = /Caminhão|Truck/i;
const CLIENT_LABEL = /Cliente|Customer/i;

export function e2eStamp(): string {
  return Date.now().toString(36);
}

export function plateFromTruckLabel(label: string): string {
  const marked = label.match(/·\s*([^│]+?)\s*│/);
  if (marked?.[1]) return marked[1].trim();
  return label.split("│")[0]?.trim() || label.trim();
}

export function clientNameFromOption(label: string): string {
  return label.split("—")[0]?.trim() || label.trim();
}

async function fillByLabel(scope: Locator, label: RegExp, value: string) {
  await scope.getByLabel(label).fill(value);
}

export async function ensureCliente(
  page: Page,
  dashboard: DashboardPage,
  nome: string,
): Promise<void> {
  await dashboard.openManagement(/Clientes|Clients/i);
  const form = page.locator(".motoristas-section");
  const stamp = e2eStamp();
  await fillByLabel(form, /Nome Completo|Full Name/i, nome);
  await fillByLabel(form, /^Email$/i, `e2e.cliente.${stamp}@koda.test`);
  await fillByLabel(form, /CPF|CNPJ|Document/i, `E2E${stamp}`.slice(0, 20));
  await fillByLabel(form, /^Latitude$/i, "-23.56");
  await fillByLabel(form, /^Longitude$/i, "-46.64");
  await clickClear(form.getByRole("button", { name: /Salvar Cliente|Save Customer/i }));
  await dashboard.expectToast(/Cliente cadastrado|Customer registered/i);
}

export async function ensureCaminhaoDisponivel(
  page: Page,
  dashboard: DashboardPage,
  plate: string,
): Promise<void> {
  await dashboard.openManagement(/Caminhões|Trucks/i);
  const form = page.locator(".motoristas-section");
  const driverOptions = await waitRealOptions(form, /Motorista Responsável|Responsible Driver/i);

  if (driverOptions.length === 0) {
    const driverName = `E2E Driver ${e2eStamp()}`;
    await dashboard.openManagement(/Motoristas|Drivers/i);
    const driverForm = page.locator(".motoristas-section");
    await fillByLabel(driverForm, /Nome Completo|Full Name/i, driverName);
    await fillByLabel(driverForm, /^Email$/i, `e2e.driver.${e2eStamp()}@koda.test`);
    await fillByLabel(driverForm, /Senha Temporária|Temporary Password/i, "E2e12345");
    await clickClear(driverForm.getByRole("button", { name: /Salvar Motorista|Save Driver/i }));
    await dashboard.expectToast(/Motorista cadastrado|Driver registered/i);
    await dashboard.openManagement(/Caminhões|Trucks/i);
  }

  const truckForm = page.locator(".motoristas-section");
  await fillByLabel(truckForm, /Placa|License Plate/i, plate);
  await fillByLabel(truckForm, /Modelo|Model/i, "E2E");
  await fillByLabel(truckForm, /Marca|Brand/i, "Koda");
  await fillByLabel(truckForm, /Capacidade|Capacity/i, "1000");
  await pickCustomSelect(truckForm, /Motorista Responsável|Responsible Driver/i);
  await clickClear(truckForm.getByRole("button", { name: /Salvar Caminhão|Save Truck/i }));
  await dashboard.expectToast(/Caminhão cadastrado|Truck registered/i);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function waitRealOptions(scope: Locator, label: RegExp): Promise<string[]> {
  let last: string[] = [];
  try {
    await expect.poll(async () => {
      last = realCustomOptions(await readCustomOptions(scope, label));
      return last.length;
    }, { timeout: 12_000, intervals: [400, 800, 1200] }).toBeGreaterThan(0);
  } catch {
    return last;
  }
  return last;
}

async function chooseTruckInCarga(dialog: Locator, preferPlate?: string): Promise<string> {
  const options = await waitRealOptions(dialog, TRUCK_LABEL);
  if (options.length === 0) {
    throw new Error("sem-caminhao");
  }
  return pickCustomSelect(
    dialog,
    TRUCK_LABEL,
    preferPlate ? { prefer: new RegExp(escapeRegExp(preferPlate)) } : undefined,
  );
}

export async function criarCargaEViagem(
  page: Page,
  dashboard: DashboardPage,
  options?: { clientName?: string; coords?: { lat: string; lng: string } },
): Promise<OperacaoCriada> {
  const stamp = e2eStamp();
  const tipo = `E2E ${stamp}`;
  const notes = `E2E ${stamp}`;
  const plateHint = `E${stamp.slice(-6)}`.slice(0, 10);
  let createdPlate = "";

  await dashboard.openCargas();
  await clickClear(page.getByRole("button", { name: /\+ Nova carga|\+ New load/i }));
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Nova carga|New Cargo/i })).toBeVisible();
  await fillByLabel(dialog, /Tipo de carga|Cargo Type/i, tipo);
  await fillByLabel(dialog, /Temp\. mínima|Min\. Temp/i, "2");
  await fillByLabel(dialog, /Temp\. máxima|Max\. Temp/i, "8");
  await fillByLabel(dialog, /^Latitude$/i, options?.coords?.lat ?? "-23.55");
  await fillByLabel(dialog, /^Longitude$/i, options?.coords?.lng ?? "-46.63");

  try {
    const truckLabel = await chooseTruckInCarga(dialog);
    createdPlate = plateFromTruckLabel(truckLabel);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "sem-caminhao") throw error;
    await clickClear(dialog.getByRole("button", { name: /Cancelar|Cancel/i }));
    await ensureCaminhaoDisponivel(page, dashboard, plateHint);
    createdPlate = plateHint;
    await dashboard.openCargas();
    await clickClear(page.getByRole("button", { name: /\+ Nova carga|\+ New load/i }));
    dialog = page.getByRole("dialog");
    await fillByLabel(dialog, /Tipo de carga|Cargo Type/i, tipo);
    await fillByLabel(dialog, /Temp\. mínima|Min\. Temp/i, "2");
    await fillByLabel(dialog, /Temp\. máxima|Max\. Temp/i, "8");
    await fillByLabel(dialog, /^Latitude$/i, options?.coords?.lat ?? "-23.55");
    await fillByLabel(dialog, /^Longitude$/i, options?.coords?.lng ?? "-46.63");
    const truckLabel = await chooseTruckInCarga(dialog, createdPlate);
    createdPlate = plateFromTruckLabel(truckLabel);
  }

  await clickClear(dialog.getByRole("button", { name: /Criar carga|Create Cargo/i }));
  await dashboard.expectToast(/Carga criada com sucesso|Cargo created successfully/i);

  await page.getByPlaceholder(/Tipo ou placa|Type or vehicle plate/i).fill(tipo);
  await expect(page.locator("td", { hasText: tipo }).first()).toBeVisible();

  let clientName = options?.clientName ?? "";
  await dashboard.openViagens();
  await clickClear(page.getByRole("button", { name: /\+ Nova viagem|\+ New trip/i }));
  dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Nova viagem|New Trip/i })).toBeVisible();

  const clientOptions = await waitRealOptions(dialog, CLIENT_LABEL);
  const clientMissing = Boolean(clientName) && !clientOptions.some((option) => option.includes(clientName));
  if (clientMissing || (!clientName && clientOptions.length === 0)) {
    await clickClear(dialog.getByRole("button", { name: /Cancelar|Cancel/i }));
    if (!clientName) clientName = `E2E Cliente ${stamp}`;
    await ensureCliente(page, dashboard, clientName);
    await dashboard.openViagens();
    await clickClear(page.getByRole("button", { name: /\+ Nova viagem|\+ New trip/i }));
    dialog = page.getByRole("dialog");
    await expect.poll(async () => {
      const options = realCustomOptions(await readCustomOptions(dialog, CLIENT_LABEL));
      return options.some((option) => option.includes(clientName));
    }, { timeout: 15_000 }).toBe(true);
  }

  if (createdPlate) {
    await expect.poll(async () => {
      const options = realCustomOptions(await readCustomOptions(dialog, TRUCK_LABEL));
      return options.some((option) => option.includes(createdPlate));
    }, { timeout: 15_000 }).toBe(true);
  }

  const truckLabel = await pickCustomSelect(
    dialog,
    TRUCK_LABEL,
    createdPlate ? { prefer: new RegExp(escapeRegExp(createdPlate)) } : undefined,
  );
  createdPlate = plateFromTruckLabel(truckLabel);

  const clientLabel = await pickCustomSelect(
    dialog,
    CLIENT_LABEL,
    clientName ? { prefer: new RegExp(escapeRegExp(clientName)) } : undefined,
  );
  clientName = clientNameFromOption(clientLabel);

  await dialog.locator("#trip-obs").fill(notes);
  await clickClear(dialog.getByRole("button", { name: /Criar viagem|Create Trip/i }));
  await dashboard.expectToast(/Entrega criada com sucesso|Delivery created successfully/i);

  await page.getByPlaceholder(/Cliente, endereço, placa|Client, address, plate/i).fill(createdPlate);
  await expect(page.locator("tr", { hasText: createdPlate }).first()).toBeVisible();

  return { tipo, plate: createdPlate, clientName, notes };
}

export async function marcarViagemEntregue(page: Page, dashboard: DashboardPage, plate: string) {
  await dashboard.openViagens();
  await page.getByPlaceholder(/Cliente, endereço, placa|Client, address, plate/i).fill(plate);
  const row = page.locator("tr", { hasText: plate }).first();
  await expect(row).toBeVisible();
  await clickClear(row.getByRole("button", { name: /Editar|Edit/i }));
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Editar viagem|Edit Trip/i })).toBeVisible();
  await dialog.locator(".custom-select-wrapper").filter({
    has: page.locator("label.select-label", { hasText: /^Status$/i }),
  }).locator(".select-trigger").scrollIntoViewIfNeeded();
  await pickCustomSelect(dialog, /^Status$/i, { prefer: /^Entregue$|^Delivered$/i });
  await clickClear(dialog.getByRole("button", { name: /Salvar alterações|Save Changes/i }));
  await dashboard.expectToast(/Viagem atualizada|Trip updated/i);
}
