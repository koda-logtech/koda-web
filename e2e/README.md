# E2E (Playwright)

Testes de interface no `koda-web`. Dependem do **`koda-server`** rodando (o script `scripts/e2e-stack.mjs` sobe API + Vite antes dos testes, ou reutiliza processos já ativos em local).

Conta de automação no Supabase: **`e2e-admin@koda.com`** (admin). Credenciais não ficam no repositório.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run test:e2e` | Suíte completa |
| `npm run test:e2e:headless` | Suíte completa em headless (vídeo e screenshot só quando um teste falha) |
| `npm run test:e2e -- e2e/smoke.spec.ts` | Apenas smoke (login, sem autenticar) |
| `npm run test:e2e:ui` | Playwright UI |
| `npm run test:e2e:report` | Abre o último HTML report |
| `npx playwright install chromium` | Primeira vez / após atualizar `@playwright/test` |

## Variáveis (local)

No `.env` do `koda-web` (seção E2E em `.env.example`). O `playwright.config.ts` lê esse arquivo; variáveis já exportadas no shell têm prioridade. Não commitar senha.

| Variável | Uso |
|----------|-----|
| `E2E_ADMIN_EMAIL` | Login nos testes que autenticam (padrão: `e2e-admin@koda.com`) |
| `E2E_ADMIN_PASSWORD` | Senha da conta E2E no Supabase |
| `KODA_SERVER_DIR` | Opcional. Caminho do repo `koda-server` se não for `../koda-server` |
| `VITE_API_URL` | Opcional. Default `http://localhost:3000` no stack E2E |

`koda-server/.env` continua obrigatório como no dev (Supabase, JWT, etc.). `CORS_ORIGIN` deve incluir `http://localhost:5173`.

## Com vs sem credenciais

| Escopo | `E2E_ADMIN_*` | Comportamento |
|--------|---------------|---------------|
| `smoke.spec.ts` | Não | Abre `/login` e valida a tela |
| `auth.setup.ts`, `admin-users.spec.ts` | Sim | Login e fluxos admin; sem variáveis, esses testes **falham** com mensagem em `e2e/e2e-credentials.ts` |

Com credenciais configuradas, o setup grava sessão em `e2e/.auth/admin.json` (gitignored).

## CI

Workflow: `.github/workflows/e2e.yml` (checkout `koda-web` + `koda-server`, runner Ubuntu).

### GitHub Secrets (repo **koda-web** → Settings → Secrets and variables → **Actions** → **New repository secret**)

Criar **três** secrets, um por vez. O **Name** é exatamente o da primeira coluna; o **Secret** é o valor.

| Name (copiar igual) | Secret (valor) |
|---------------------|----------------|
| `E2E_ADMIN_EMAIL` | `e2e-admin@koda.com` |
| `E2E_ADMIN_PASSWORD` | Senha da conta E2E (texto simples, sem aspas) |
| `E2E_SERVER_ENV_FILE` | Abra o `koda-server/.env` no editor, selecione **tudo** (Cmd+A), copie e cole no campo Secret — várias linhas, igual ao arquivo local |

Não use prefixo `secrets.` no nome; não crie um único JSON com os três. Cada linha do `.env` do server no terceiro secret permanece como no arquivo (`KEY=valor`).

Após o push da branch com `e2e.yml` para `main` (ou PR), o job **E2E (Playwright)** roda no Actions. Falta de secret → passo “Verify E2E secrets” falha listando só o **nome** do secret ausente.

`.github/scripts/write-server-env.sh` grava o `.env` do server no runner sem imprimir o conteúdo.

Job separado do `ci.yml` (lint/Vitest). Deploy Cloud Run não executa E2E.

## Specs

| Arquivo | Credenciais | Cobertura |
|---------|-------------|-----------|
| `smoke.spec.ts` | Não | `/login` |
| `public-routes.spec.ts` | Não | `/solicitar-acesso`, `/ativar-conta`, 404 |
| `dashboard-navigation.spec.ts` | Sim | Abas do dashboard autenticado |
| `admin-users.spec.ts` | Sim | Login, admin usuários/solicitações, atalho sidebar |
| `operador-login-tema-logout.spec.ts` | Sim | Login, dashboard, tema dark/light e logout |
| `operador-carga-viagem.spec.ts` | Sim | Nova carga vinculada a caminhão e nova viagem com cliente |
| `operador-dashboard-mapa-alertas.spec.ts` | Sim | Mapa Mapbox, filtro de alertas térmicos e alerta sonoro/visual |
| `operador-auditoria-export.spec.ts` | Sim | Auditoria e download de PDF e CSV |
| `auth.setup.ts` | Sim | Sessão reutilizável |

## Arquivos

| Caminho | Função |
|---------|--------|
| `playwright.config.ts` | Config, `webServer`, projetos setup/chromium |
| `e2e/pages/` | Page objects |
| `e2e/helpers/` | Select customizado e cadastros mínimos da operação |
| `e2e/e2e-credentials.ts` | Validação de `E2E_ADMIN_*` e mensagens de erro |

O `playwright.config.ts` roda o Chromium em headless. `--headed` continua disponível para debug. Em falha, o Playwright guarda screenshot, trace e vídeo em `test-results/`. O mapa do dashboard exige `VITE_MAPBOX_TOKEN` no `.env` do koda-web.
