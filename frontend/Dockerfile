# 1) Image de build
FROM node:20 AS build
WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le code et builder
COPY . .
RUN npm run build

# 2) Image finale avec nginx et configuration custom
FROM nginx:1.29.0-alpine

# Copier votre conf nginx (try_files pour SPA)  
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers statiques générés  
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Lancer nginx en avant‑plan
CMD ["nginx", "-g", "daemon off;"]
