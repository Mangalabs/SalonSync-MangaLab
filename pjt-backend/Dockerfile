FROM node:20-alpine

WORKDIR /pjt-backend
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000

CMD ["npm", "start"]

COPY ./docker-entrypoint.sh /docker-entrypoint.sh
RUN ["chmod", "+x", "/docker-entrypoint.sh"]
ENTRYPOINT ["sh", "/docker-entrypoint.sh"]