FROM node:22.14.0-alpine

ARG ALLOWED_ORIGIN
# special env variables for supabase
ARG SUPABASE_ACCESS_TOKEN
ARG SUPABASE_PROJECT_ID
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

WORKDIR /src/app/

COPY ./package.json ./package-lock.json /src/app/

RUN npm ci

COPY ./ /src/app/


RUN echo "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" >> .env
RUN echo "SUPABASE_URL=${SUPABASE_URL}" >> .env
RUN echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >> .env

RUN npx supabase gen types --lang typescript --project-id ${SUPABASE_PROJECT_ID} > src/supabase-db.types.ts
RUN npm run build

EXPOSE 3000

ENTRYPOINT ["node", "dist/main.js"]