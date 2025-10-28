# Используем node
FROM node:20-alpine

WORKDIR /var/www/planner

# Копируем зависимости

# Устанавливаем зависимости

# Копируем остальной код
COPY . .
COPY package*.json ./
# RUN npm install --legacy-peer-deps

# Открываем порт для Vite
EXPOSE 5173
