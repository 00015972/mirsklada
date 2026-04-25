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
RUN pnpm --filter @mirsklada/web build

# ---- Runner stage ----
FROM nginx:alpine AS runner

# Copy built static files
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config directly (not as template to avoid entrypoint corruption)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# At runtime: wire listen port and API upstream endpoint, then start nginx
CMD ["/bin/sh", "-c", "API_UPSTREAM=${API_UPSTREAM:-mirskladaapi.railway.internal:3000}; sed -i \"s/listen 80/listen ${PORT:-80}/\" /etc/nginx/conf.d/default.conf; sed -i \"s|__API_UPSTREAM__|${API_UPSTREAM}|\" /etc/nginx/conf.d/default.conf; exec nginx -g 'daemon off;'" ]
