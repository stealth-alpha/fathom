FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS install
RUN npm install --global @fathomcli/fathom@0.1.0

FROM base AS run
COPY --from=install /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=install /usr/local/bin/fathom /usr/local/bin/fathom
WORKDIR /workspace
VOLUME ["/workspace"]
EXPOSE 4173
ENTRYPOINT ["fathom"]
CMD ["--help"]
