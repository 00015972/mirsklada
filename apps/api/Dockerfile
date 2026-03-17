FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Build stage ----
FROM base AS build
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @mirsklada/shared build
RUN pnpm --filter @mirsklada/database build
RUN pnpm --filter @mirsklada/api build

# Extract self-contained production bundle
# RUN pnpm deploy --filter @mirsklada/api --prod /prod/api
RUN pnpm deploy --legacy --filter @mirsklada/api --prod /prod/api

# ensure prisma client exists in final bundle
RUN cp -r node_modules/.pnpm/@prisma* /prod/api/node_modules/.pnpm/ 2>/dev/null || true

# ---- Runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /prod/api .

EXPOSE 3000
CMD ["node", "dist/index.js"]