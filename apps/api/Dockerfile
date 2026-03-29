FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl
RUN corepack enable

# ---- Build stage ----
FROM base AS build
WORKDIR /app

ENV CI=true

COPY . .

# install with pnpm (for monorepo build)
RUN pnpm install --frozen-lockfile

# build everything
RUN pnpm --filter @mirsklada/database db:generate
RUN pnpm --filter @mirsklada/shared build
RUN pnpm --filter @mirsklada/database build
RUN pnpm --filter @mirsklada/api build

# production bundle
RUN pnpm deploy --legacy --filter @mirsklada/api --prod /prod/api
RUN PRISMA_SRC_DIR="$(find node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -n 1)" \
    && PRISMA_DEST_DIR="$(find /prod/api/node_modules/.pnpm -maxdepth 1 -type d -name '@prisma+client@*' | head -n 1)" \
    && test -n "$PRISMA_SRC_DIR" \
    && test -n "$PRISMA_DEST_DIR" \
    && mkdir -p "$PRISMA_DEST_DIR/node_modules/.prisma" \
    && cp -R "$PRISMA_SRC_DIR/node_modules/.prisma/." "$PRISMA_DEST_DIR/node_modules/.prisma/"

# ---- Runner stage ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /prod/api ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
