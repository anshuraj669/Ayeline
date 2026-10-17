# syntax=docker/dockerfile:1
# Ayeline: one small image that runs anywhere containers run.
#
#   docker build -t ayeline .
#   docker run -p 3000:3000 -e DATABASE_URL=postgres://... -e STAFF_PIN=... ayeline
#
# Service requests, RSVPs and report photos all live in Postgres, so the container keeps
# nothing on disk and needs no volume. Tables are created on the first request.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
# Git doesn't keep empty folders, so public/ may be missing from a fresh clone.
RUN mkdir -p public && npm run build

FROM node:${NODE_VERSION}-alpine
WORKDIR /app
LABEL org.opencontainers.image.title="Ayeline" \
      org.opencontainers.image.description="Your city council's agenda, made readable, with a live 311 service desk" \
      org.opencontainers.image.licenses="MIT"
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --chown=node:node LICENSE ./
USER node
EXPOSE 3000
# Reports whether the database is connected too; see /api/health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
# Lets the server finish open requests when the host stops the container.
STOPSIGNAL SIGTERM
CMD ["node", "server.js"]
