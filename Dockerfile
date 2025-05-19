# Etapa 1: build da aplicação
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: imagem final com PostgreSQL embutido
FROM node:18-slim

WORKDIR /app

# Instala PostgreSQL
RUN apt-get update && apt-get install -y postgresql

# Copia app e dependências
COPY --from=builder /app /app
COPY --from=builder /app/node_modules ./node_modules

# Variáveis internas
ENV PGDATA=/var/lib/postgresql/data
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV NODE_ENV=production

# Porta exposta pela aplicação
EXPOSE 3333

# Inicializa banco e backend
CMD service postgresql start && \
    sleep 2 && \
    psql -U postgres -c "CREATE DATABASE postgres;" && \
    npx prisma migrate deploy && \
    node dist/main
