FROM node:20

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Exposer le port Vite
EXPOSE 5173

# Commande par défaut pour le dev
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]