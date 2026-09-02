FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS runtime
RUN apk add --no-cache gettext

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/docker/40-generate-runtime-config.sh /docker-entrypoint.d/40-generate-runtime-config.sh
COPY deploy/docker/config.template.json /opt/assistant-spa/config.template.json
COPY --from=build /app/dist/assistant-spa/browser /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-generate-runtime-config.sh

EXPOSE 8080
