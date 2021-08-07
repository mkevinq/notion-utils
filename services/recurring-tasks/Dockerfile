FROM node:14

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY . .
RUN yarn workspace @notion-utils/recurring-tasks install
RUN yarn workspace @notion-utils/recurring-tasks build

CMD ["yarn", "workspace", "@notion-utils/recurring-tasks", "start"]
