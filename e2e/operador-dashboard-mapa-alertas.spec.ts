import { test, expect } from "@playwright/test";
import { assertE2ECredentials } from "./e2e-credentials";
import { DashboardPage } from "./pages/dashboard.page";
import { criarCargaEViagem } from "./helpers/operacao";

test.describe("operador — mapa e alertas térmicos", () => {
  test.beforeEach(() => {
    assertE2ECredentials();
  });

  test("mostra o mapa no dashboard e filtra alertas térmicos", async ({ page }) => {
    test.setTimeout(150_000);
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectShell();

    const mapSection = page.locator(".map-section");
    await expect(mapSection).toBeVisible();

    await expect(page.getByText(/^Carregando dados\.\.\.$|^Loading data\.\.\.$/i)).toBeHidden({
      timeout: 45_000,
    });

    const canvas = page.locator(".dashboard-map-root .mapboxgl-canvas");
    const noTrips = page.getByText(/Nenhuma viagem com coordenadas|No trips with coordinates/i);
    const noToken = page.getByText(/Configure VITE_MAPBOX_TOKEN/i);
    await expect(canvas.or(noTrips).or(noToken).first()).toBeVisible({ timeout: 45_000 });

    const tokenConfigured = Boolean(process.env.VITE_MAPBOX_TOKEN?.trim());
    if (!tokenConfigured) {
      await expect(noToken).toBeVisible();
    } else {
      if (await noToken.isVisible()) {
        throw new Error(
          "VITE_MAPBOX_TOKEN ausente no Vite: o dashboard não renderiza o mapa Mapbox. O token precisa existir no ambiente antes de o webServer subir.",
        );
      }

      if (!(await canvas.isVisible())) {
        await criarCargaEViagem(page, dashboard, {
          clientName: `E2E Mapa ${Date.now().toString(36)}`,
          coords: { lat: "-23.55", lng: "-46.63" },
        });
        await dashboard.clickSidebar(/^Dashboard$/i);
        await expect(mapSection).toBeVisible();
      }

      await expect(canvas).toBeVisible({ timeout: 30_000 });
    }

    await dashboard.clickSidebar(/Alertas|Alerts/i);
    await expect(page.getByRole("heading", { name: /Alertas térmicos|Thermal alerts/i })).toBeVisible();

    const status = page.getByLabel(/Filtro por status|Filter by status/i);
    const tipo = page.getByLabel(/Filtro por tipo|Filter by type/i);
    await status.selectOption("aberto");
    await tipo.selectOption("alta");
    await expect(status).toHaveValue("aberto");
    await expect(tipo).toHaveValue("alta");
    await expect(page.locator(".alertas-page table.data-table")).toBeVisible();
  });

  test("dispara alerta visual e sonoro quando surge um alerta aberto", async ({ page }) => {
    test.setTimeout(60_000);
    const dashboard = new DashboardPage(page);
    const openedAt = new Date().toISOString();
    let firstListAt = 0;

    await page.addInitScript(() => {
      const target = window as Window & { __e2eAudioPlays?: number };
      target.__e2eAudioPlays = 0;
      class FakeAudioParam {
        setValueAtTime() {}
        exponentialRampToValueAtTime() {}
      }
      class FakeAudioContext {
        currentTime = 0;
        destination = {};
        createOscillator() {
          return {
            type: "sine",
            frequency: new FakeAudioParam(),
            connect() {},
            start() {
              target.__e2eAudioPlays = (target.__e2eAudioPlays ?? 0) + 1;
            },
            stop() {},
            onended: null as null | (() => void),
          };
        }
        createGain() {
          return {
            gain: new FakeAudioParam(),
            connect() {},
          };
        }
        close() {
          return Promise.resolve();
        }
      }
      window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext =
        FakeAudioContext as unknown as typeof AudioContext;
    });

    await page.routeWebSocket(/realtime|supabase/i, (socket) => {
      socket.close();
    });

    await page.route("**/api/alertas**", async (route) => {
      const url = new URL(route.request().url());
      const { pathname } = url;
      if (pathname.endsWith("/contagem") || /\/alertas\/\d+$/.test(pathname)) {
        await route.continue();
        return;
      }
      if (!pathname.endsWith("/alertas")) {
        await route.continue();
        return;
      }

      if (!firstListAt) firstListAt = Date.now();
      const body = Date.now() - firstListAt < 2_500
        ? []
        : [{
          id: 987654321,
          id_carga: 1,
          tipo: "alta",
          status: "aberto",
          limite_minimo: 0,
          limite_maximo: 8,
          temperatura_inicio: 9,
          temperatura_pico: 12,
          temperatura_fim: null,
          qtd_pings: 3,
          aberto_telemetria_id: null,
          resolvido_telemetria_id: null,
          aberto_at: openedAt,
          resolvido_at: null,
          created_at: openedAt,
          updated_at: openedAt,
          carga: {
            id: 1,
            tipo: "E2E refrigerada",
            temperatura_minima: 0,
            temperatura_maxima: 8,
          },
        }];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await dashboard.goto();
    await dashboard.expectShell();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 25_000 });
    await expect(dialog).toContainText(/Novo alerta térmico|New thermal alert/i);
    await expect(dialog).toContainText(/Temperatura ACIMA do máximo|Temperature ABOVE maximum/i);
    await expect.poll(async () => page.evaluate(() => {
      const plays = (window as Window & { __e2eAudioPlays?: number }).__e2eAudioPlays ?? 0;
      return plays;
    })).toBeGreaterThan(0);
  });
});
