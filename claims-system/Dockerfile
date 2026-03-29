FROM mcr.microsoft.com/playwright/node:20-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npx playwright install chromium --with-deps

COPY . .

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "src/index.js"]
