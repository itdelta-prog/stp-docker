FROM node:23

# # dependencies of OS for puppeteer
RUN apt-get update && apt-get install -y \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libayatana-appindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# package.json и package-lock.json
COPY package*.json ./

RUN npm install
# if prod
# RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["npm", "start", "--host=0.0.0.0", "--port=3000"]
