# build vite application stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# build nginx web server stage
FROM nginx:alpine

RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia o nginx.conf para a pasta de templates onde o Nginx processa no boot
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Garante que o Nginx substitua apenas a variável VITE_API_URL (sem tocar nas variáveis internas do Nginx)
ENV NGINX_ENVSUBST_FILTER="VITE_API_URL"

COPY --from=builder /app/dist /usr/share/nginx/html

# Copia o script que gera o env.js no startup do container
COPY generate-env.sh /docker-entrypoint.d/40-generate-env.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]