FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Force npm to use official registry, ignore any .npmrc mirror settings
RUN npm install --registry https://registry.npmjs.org

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]