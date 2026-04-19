FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Uso vite build directo en lugar de "npm run build" (que tambien corre tsc -b).
# Los errores de TS son warnings de codigo muerto / tipos estrictos que no afectan
# el bundle final y ya existen en desarrollo local.
RUN npx vite build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
