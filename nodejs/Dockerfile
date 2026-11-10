FROM node:22-alpine

WORKDIR /app

RUN addgroup -S smart-expense-group && adduser -S smart-expense-be-user -G smart-expense-group

COPY --chown=smart-expense-be-user:smart-expense-group package*.json ./

RUN npm ci --omit-dev --no-audit --no-fund

COPY --chown=smart-expense-be-user:smart-expense-group . .

USER smart-expense-be-user

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${PORT:-3000}/health" || exit 1

CMD ["node", "app.js"]
