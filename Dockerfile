FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV UPLOADS_DIR=/data/uploads
WORKDIR /app/BACK-END

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY BACK-END/package.json BACK-END/package-lock.json ./
RUN npm ci

COPY BACK-END/ ./
COPY FRON_END/ /app/FRON_END/
RUN DATABASE_URL="mysql://app:build@localhost:3306/incidentes" npx prisma generate && mkdir -p /data/uploads

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm start"]
