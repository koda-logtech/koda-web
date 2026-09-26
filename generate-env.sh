#!/bin/sh

# O Nginx servirá a aplicação a partir daqui
HTML_DIR="/usr/share/nginx/html"

# Cria/sobrescreve o arquivo env.js com as variáveis
# Usa MAPBOX_ACCESS_TOKEN como prioridade, fallback para VITE_MAPBOX_TOKEN
cat <<EOT > "${HTML_DIR}/env.js"
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_APP_NAME: "${VITE_APP_NAME}",
  VITE_MAPBOX_TOKEN: "${MAPBOX_ACCESS_TOKEN:-$VITE_MAPBOX_TOKEN}",
  VITE_STORAGE_PREFIX: "${VITE_STORAGE_PREFIX}",
  VITE_ACCESS_TOKEN_KEY: "${VITE_ACCESS_TOKEN_KEY}",
  VITE_REFRESH_TOKEN_KEY: "${VITE_REFRESH_TOKEN_KEY}"
};
EOT

echo "env.js gerado com sucesso:"
cat "${HTML_DIR}/env.js"
