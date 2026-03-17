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
RUN pnpm db:generate
RUN pnpm --filter @mirsklada/shared build
RUN pnpm --filter @mirsklada/database build
RUN pnpm --filter @mirsklada/api build

# switch to clean npm runtime deps
RUN rm -rf node_modules
RUN npm install --omit=dev

# ---- Runner stage ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# copy ONLY what is needed
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json .

EXPOSE 3000
CMD ["node", "-e", "console.log('STARTED'); setTimeout(()=>{}, 100000)"]