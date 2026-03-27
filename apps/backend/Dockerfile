FROM node:22-slim AS builder

WORKDIR /workspace/apps/backend

COPY apps/backend/package*.json ./
RUN npm install

COPY apps/backend/tsconfig.json ./tsconfig.json
COPY apps/backend/src ./src
COPY packages/shared /workspace/packages/shared

RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

COPY --from=builder /workspace/apps/backend/package*.json ./
COPY --from=builder /workspace/apps/backend/node_modules ./node_modules
COPY --from=builder /workspace/apps/backend/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
