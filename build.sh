#!/bin/bash
set -e

echo "Building packages/shared first..."
npm run build --workspace=packages/shared

echo "Building apps/api..."
npm run build --workspace=apps/api

echo "Build completed successfully!"
