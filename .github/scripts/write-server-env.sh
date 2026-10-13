#!/usr/bin/env bash
# Grava koda-server/.env a partir de E2E_SERVER_ENV_FILE (GitHub Secret).
# Não imprime o conteúdo do arquivo (evita vazamento em logs).
set -euo pipefail

TARGET="${1:-koda-server/.env}"

if [[ -z "${E2E_SERVER_ENV_FILE:-}" ]]; then
  echo "E2E_SERVER_ENV_FILE não definido." >&2
  exit 1
fi

umask 077
mkdir -p "$(dirname "$TARGET")"
printf '%s' "$E2E_SERVER_ENV_FILE" > "$TARGET"

# Confirmação sem expor valores
if [[ -s "$TARGET" ]]; then
  echo "Arquivo do server criado ($(wc -c < "$TARGET" | tr -d ' ') bytes)."
else
  echo "Arquivo do server vazio." >&2
  exit 1
fi
