#!/bin/sh

# O Nginx servirá a aplicação a partir daqui
HTML_DIR="/usr/share/nginx/html"

# Cria/sobrescreve o arquivo env.js com as variáveis
# Usa MAPBOX_ACCESS_TOKEN como prioridade, fallback para VITE_MAPBOX_TOKEN
cat <<EOT > "${HTML_DIR}/env.js"
window.__ENV__ = {
  VITE_MAPBOX_TOKEN: "${MAPBOX_ACCESS_TOKEN:-$VITE_MAPBOX_TOKEN}"
};
EOT

echo "env.js gerado com sucesso:"
cat "${HTML_DIR}/env.js"
