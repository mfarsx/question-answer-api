FROM node:22-alpine

# Harden: create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=appuser:appgroup . .

# profile images write dir for non-root user
RUN mkdir -p /app/public/uploads/profile && chown -R appuser:appgroup /app/public

USER appuser

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]
