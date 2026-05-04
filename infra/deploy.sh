#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f infra/docker-compose.prod.yml --env-file infra/.env"

cd "$(git rev-parse --show-toplevel)"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Building images"
$COMPOSE build --pull

echo "==> Running migrations"
$COMPOSE run --rm api alembic upgrade head

echo "==> Restarting services"
$COMPOSE up -d --remove-orphans

echo "==> Done. Active containers:"
$COMPOSE ps
