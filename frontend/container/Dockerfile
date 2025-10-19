# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# מעתיקים את קבצי ה־package (הכוכבית תעתיק גם package-lock.json אם קיים)
COPY package*.json ./
RUN npm ci || npm install

# עכשיו כל הקוד
COPY . .

# אפשר להזרים API URL בזמן build אם תרצה (עם compose)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- runtime (nginx) ----------
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# קובץ ה־nginx חייב להיות בתוך frontend/container/nginx.conf
COPY container/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
