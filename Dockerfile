FROM node:18
RUN apt-get update && apt-get install -y chromium-browser
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "bot.js"]
