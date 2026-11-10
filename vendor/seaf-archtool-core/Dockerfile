# syntax = docker/dockerfile:1.3
ARG NGINX_IMAGE=nginx:1.31.6-alpine3.24-slim
ARG NODE_IMAGE=node:22.23.2-alpine3.23
ARG REGISTRY=docker.io

# ------------------------------ Source -----------------------------
FROM ${REGISTRY}/alpine:latest AS source

WORKDIR /var/www

COPY . .

RUN rm -rf resources

# ------------------------ All dependencies -------------------------
FROM ${REGISTRY}/${NODE_IMAGE} AS all-deps

WORKDIR /var/www

COPY plugins                        ./plugins/
COPY libs                           ./libs/
COPY package.json package-lock.json ./

ENV npm_config_audit=false
ENV npm_config_fund=false 
ENV npm_config_logs_max=0 

RUN npm ci

# ------------------ Only production-dependencies -------------------
FROM all-deps AS prod-deps

WORKDIR /var/www

ARG GITVERSE=false

RUN npm prune --production && \
    npm cache clean --force && \
    # The GitVerse Docker registry requires each layer to be no larger than 100 MB 
    if [ "$GITVERSE" = "true" ]; then \
        mkdir -p node_modules_1 && \
        find node_modules -maxdepth 1 -type d -name "[@a-k]*" -exec mv -t node_modules_1/ {} + ; \
    else \
        mkdir -p node_modules_1 ; \
    fi

# -------------------------- Build frontend -------------------------
FROM ${REGISTRY}/${NODE_IMAGE} AS build-front

WORKDIR /var/www

COPY --from=source   /var/www .
COPY --from=all-deps /var/www .

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV VUE_APP_DOCHUB_MODE=backend
ENV VUE_APP_PLANTUML_SERVER=ORIGIN

RUN npm run build
RUN find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# -------------------------- Backend needs --------------------------
FROM ${REGISTRY}/${NODE_IMAGE} AS backend-needs

WORKDIR /var/www

COPY --from=prod-deps --chown=1000:1000 --chmod=755 /var/www/node_modules/   ./node_modules/
COPY --from=prod-deps --chown=1000:1000 --chmod=755 /var/www/node_modules_1/ ./node_modules/
COPY --from=prod-deps --chown=1000:1000 --chmod=755 /var/www/package.json    ./package.json
COPY ./resources/build/docker/entrypoint.sh /tmp/entrypoint.sh

RUN VERSION=$(npm pkg get version --silent | tr -d '"') && \
    sed "s/%VERSION%/${VERSION}/" /tmp/entrypoint.sh > /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Remove npm, npx, etc.
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt /root/.npm /tmp/*
RUN apk update && apk upgrade --no-cache && apk add --no-cache tini && rm -rf /var/cache/apk/*

ENV VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS=n
ENV VUE_APP_DOCHUB_BACKEND_PORT=8080
ENV VUE_APP_PLANTUML_REQUEST_TYPE=POST_COMPRESSED

ENTRYPOINT ["/entrypoint.sh"]

# Directly run tsx (without npx)
CMD ["node_modules/.bin/tsx", "src/backend/main.mjs"]

EXPOSE 8080

# --------------------------- Only backend --------------------------
FROM backend-needs AS backend

WORKDIR /var/www

COPY --from=source --chown=1000:1000 --chmod=755 /var/www/ ./

USER 1000

ARG NODE_IMAGE

LABEL org.opencontainers.image.title="seaf-archtool-core (backend)" \
      org.opencontainers.image.authors="SEAF Team" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.base.name="${NODE_IMAGE}" \
      maintainer=""

# -------------------------- Only frontend --------------------------
FROM ${REGISTRY}/${NGINX_IMAGE} AS frontend

COPY --from=build-front --chown=101:101 --chmod=755 /var/www/dist /usr/share/nginx/html

WORKDIR /var/cache/nginx

RUN mkdir -p client_temp proxy_temp && \
    chown -R 101:101 /var/cache/nginx && chmod -R 750 /var/cache/nginx && \
    chown -R 101:101 /run && chmod -R 777 /run
RUN mkdir -p /etc/nginx/extra-conf.d && \
    rm /etc/nginx/conf.d/default.conf
RUN sed -i '/error_log/d' /etc/nginx/nginx.conf

COPY --chown=101:101 --chmod=755 ./resources/build/docker/nginx.conf /etc/nginx/conf.d/default.conf

RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'exec /sbin/tini -- "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

WORKDIR /

RUN apk update && apk upgrade --no-cache && apk add --no-cache tini && rm -rf /var/cache/apk/*

USER 101

ENTRYPOINT ["/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off; error_log /var/log/nginx/error.log notice;"]

EXPOSE 8080

ARG NGINX_IMAGE

LABEL org.opencontainers.image.title="seaf-archtool-core (frontend)" \
      org.opencontainers.image.authors="SEAF Team" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.base.name="${NGINX_IMAGE}" \
      maintainer=""

# -------------------- Full (backend + frontend) --------------------
FROM backend AS full

WORKDIR /var/www

COPY --from=build-front --chown=1000:1000 --chmod=755 /var/www/ ./

USER 1000

ARG NODE_IMAGE

LABEL org.opencontainers.image.title="seaf-archtool-core (backend + frontend)" \
      org.opencontainers.image.authors="SEAF Team" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.base.name="${NODE_IMAGE}" \
      maintainer=""
