FROM node:20-alpine AS builder

WORKDIR /app

RUN addgroup -S smart-expense-fe-group \
    && adduser -S smart-expense-fe-user -G smart-expense-fe-group

COPY --chown=smart-expense-fe-user:smart-expense-fe-group package*.json ./

RUN npm ci --no-audit --no-fund

COPY --chown=smart-expense-fe-user:smart-expense-fe-group . .

ARG VITE_API_URL
ARG VITE_TELEGRAM_BOT_LINK
ARG VITE_PUSHER_KEY
ARG VITE_PUSHER_CLUSTER
ARG VITE_PUSHER_SUBSCRIBE
ARG VITE_PUSHER_BIND

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TELEGRAM_BOT_LINK=$VITE_TELEGRAM_BOT_LINK
ENV VITE_PUSHER_KEY=$VITE_PUSHER_KEY
ENV VITE_PUSHER_CLUSTER=$VITE_PUSHER_CLUSTER
ENV VITE_PUSHER_SUBSCRIBE=$VITE_PUSHER_SUBSCRIBE
ENV VITE_PUSHER_BIND=$VITE_PUSHER_BIND

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && find /usr/share/nginx/html -type f -exec chmod 644 {} \; \
    && find /usr/share/nginx/html -type d -exec chmod 755 {} \; \
    && mkdir -p /tmp/client_body /tmp/proxy /tmp/fastcgi /tmp/uwsgi /tmp/scgi \
    && chown -R nginx:nginx /tmp/client_body /tmp/proxy /tmp/fastcgi /tmp/uwsgi /tmp/scgi

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]