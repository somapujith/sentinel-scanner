FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5178

ENV VITE_API_PROXY_TARGET=http://backend:8000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5178"]
