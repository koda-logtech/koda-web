/**
 * Conta dedicada aos testes E2E (não use o admin pessoal do time).
 * Deve existir no mesmo Supabase que o koda-server (.env).
 */
export const E2E_ADMIN_EMAIL_DEFAULT = "e2e-admin@koda.com";

const README_HINT =
  "Veja e2e/README.md (usuário E2E, variáveis e diferença entre smoke e testes com login).";

export function assertE2ECredentials(): { email: string; password: string } {
  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD;

  const missing: string[] = [];
  if (!email) missing.push("E2E_ADMIN_EMAIL");
  if (!password) missing.push("E2E_ADMIN_PASSWORD");

  if (missing.length > 0) {
    throw new Error(
      [
        "Testes E2E de login/admin exigem credenciais do usuário dedicado a automação.",
        `Variáveis ausentes: ${missing.join(", ")}.`,
        `E-mail esperado (padrão do projeto): ${E2E_ADMIN_EMAIL_DEFAULT}`,
        "Esse usuário precisa estar cadastrado no Supabase com perfil admin e senha definida por você (nunca commitar senha).",
        "Somente o smoke (e2e/smoke.spec.ts) roda sem essas variáveis.",
        README_HINT,
      ].join(" "),
    );
  }

  return { email, password };
}
