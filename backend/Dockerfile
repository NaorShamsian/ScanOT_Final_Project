FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate || true
EXPOSE 3003
CMD ["sh","-c","npx prisma db push && npm run start:dev"]