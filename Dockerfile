FROM node:18

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y postgresql


RUN npm install
RUN npm run build

EXPOSE 3333

CMD service postgresql start && \
    sleep 2 && \
    su postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"" && \
    su postgres -c "createdb postgres || echo 'Banco postgres já existe'" && \
    npx prisma migrate deploy || echo 'Migrate falhou (ignorando)' && \
    node dist/main

