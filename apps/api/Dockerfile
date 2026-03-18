FROM node:20-slim AS base
RUN corepack enable

# ---- Build stage ----
FROM base AS build
WORKDIR /app

ENV CI=true

COPY . .

# install with pnpm (for monorepo build)
RUN pnpm install --frozen-lockfile

# build everything
# RUN pnpm --filter @mirsklada/database db:generate
RUN pnpm exec prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm --filter @mirsklada/shared build
RUN pnpm --filter @mirsklada/database build
RUN pnpm --filter @mirsklada/api build

# production bundle
RUN pnpm deploy --legacy --filter @mirsklada/api --prod /prod/api

RUN cd /prod/api && npx prisma generate

# ---- Runner stage ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl

COPY --from=build /prod/api ./

EXPOSE 3000
CMD ["node", "dist/index.js"]