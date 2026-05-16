FROM node:20-alpine

WORKDIR /app

RUN addgroup -S smart-expense-group && adduser -S smart-expense-be-user -G smart-expense-group

COPY --chown=smart-expense-be-user:smart-expense-group package*.json ./

RUN npm ci --omit-dev --no-audit --no-fund

COPY --chown=smart-expense-be-user:smart-expense-group  . .

USER smart-expense-be-user

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm","start"]