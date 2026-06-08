# Stage 1: Build
FROM node:24.14.1-alpine AS builder

ENV NX_DAEMON=false

WORKDIR /app

# Install deps first — layer cache: only reinstalls when lockfile changes
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy the full workspace (Nx needs the monorepo root to resolve packages)
COPY . .

# Build the API (production mode by default per project.json)
RUN npx nx build api

# Prune lockfile and copy local workspace modules for a minimal production install
RUN npx nx run api:prune

# Stage 2: Runtime
FROM node:24.14.1-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# Copy only the built output — includes main.js, package.json, package-lock.json, assets/, workspace_modules/
COPY --from=builder /app/dist/apps/api .

# Install only production dependencies using the pruned lockfile
RUN npm ci --omit=dev --no-audit --no-fund

EXPOSE 10000

CMD ["node", "main.js"]
