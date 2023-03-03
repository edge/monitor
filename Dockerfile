# Copyright (C) 2022 Edge Network Technologies Limited
# Use of this source code is governed by a GNU GPL-style license
# that can be found in the LICENSE.md file. All rights reserved.

FROM node:16 AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src src/
RUN npm run build

FROM node:16

ENV PUBLIC_PATH /app/public
ENV TARGETS_PATH /data/targets.json

RUN mkdir /data

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/out ./out

CMD ["npm", "start"]
