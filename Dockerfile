# Copyright (C) 2022 Edge Network Technologies Limited
# Use of this source code is governed by a GNU GPL-style license
# that can be found in the LICENSE.md file. All rights reserved.

FROM node:16

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src src/
RUN npm run build

CMD ["npm", "start"]
