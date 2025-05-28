#!/bin/bash
# Build script for Cloudflare Workers deployment

echo "Building Next.js application..."
npm run build

echo "Building for Cloudflare Workers..."
npx @cloudflare/next-on-pages@1

echo "Build complete!"