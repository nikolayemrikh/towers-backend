FROM node:22.14.0-alpine

ARG ALLOWED_ORIGIN
WORKDIR /src/app/

COPY ./package.json ./package-lock.json /src/app/

RUN npm ci

COPY ./ /src/app/

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["node", "dist/main.js"]