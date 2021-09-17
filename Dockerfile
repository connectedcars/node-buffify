ARG NODE_VERSION=14.x

FROM gcr.io/connectedcars-staging/node-builder.master:$NODE_VERSION as builder

ARG COMMIT_SHA=master

WORKDIR /app

USER builder

# Copy application code.
COPY --chown=builder:builder . /app

RUN npm install

RUN npm run build

# Run ci checks
RUN npm run ci-auto