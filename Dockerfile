# Production image for Coolify (build pack: Dockerfile, port 3000).
# Next.js prerenders pages from the store at build time and inlines
# NEXT_PUBLIC_* values, so every variable below must be available as a
# build-time variable in Coolify as well as at runtime.

FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG PRIVATE_STOREFRONT_API_TOKEN
ARG SESSION_SECRET
ARG SITE_ORIGIN
ARG NEXT_PUBLIC_STORE_DOMAIN
ARG NEXT_PUBLIC_STOREFRONT_API_TOKEN
ARG NEXT_PUBLIC_SHOP_ID
ARG NEXT_PUBLIC_STOREFRONT_ID
ARG NEXT_PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt > /dev/null || exit 1
CMD ["node", "server.js"]
