FROM node:16-alpine AS builder

RUN mkdir -p /usr/src/app/totem-angular
WORKDIR /usr/src/app/totem-angular

# RUN apk --update add git

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build:prod

# Stage 2
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY --from=builder /usr/src/app/totem-angular/dist/totem-angular .

COPY ./nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
