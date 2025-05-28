# Cloudflare Workers Deployment Guide

This guide explains how to deploy the California Auto Injury Settlement Calculator to Cloudflare Workers.

## Prerequisites

1. A Cloudflare account (free tier is sufficient)
2. Node.js and npm installed
3. The project built and ready for deployment

## Setup Steps

### 1. Create a Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template or create a custom token with:
   - **Permissions**: 
     - Account: Cloudflare Workers Scripts:Edit
     - Zone: Zone:Read, Cache Purge:Purge
   - **Account Resources**: Include your account
   - **Zone Resources**: Include All zones from an account (or specific zones)

4. Copy the generated token

### 2. Set Environment Variables

```bash
# On macOS/Linux:
export CLOUDFLARE_API_TOKEN="your-token-here"

# On Windows:
set CLOUDFLARE_API_TOKEN=your-token-here
```

### 3. Deploy the Application

```bash
# Build for Cloudflare (if not already done)
npx @cloudflare/next-on-pages@1

# Deploy to Cloudflare Workers
npx wrangler deploy
```

### 4. Configure Custom Domain (Optional)

1. In the Cloudflare dashboard, go to Workers & Pages
2. Select your deployed worker
3. Go to "Custom Domains" tab
4. Add your domain (e.g., cainjurysettlement.com)

## Environment Variables for Production

If you need to add environment variables:

1. Go to your Worker in the Cloudflare dashboard
2. Navigate to Settings > Variables
3. Add any required variables

## Rate Limiting

Since we disabled the in-memory rate limiting for Edge Runtime compatibility, configure Cloudflare's built-in rate limiting:

1. Go to Security > WAF > Rate limiting rules
2. Create a new rule:
   - **Name**: API Rate Limit
   - **Expression**: `(http.request.uri.path contains "/api/calculate")`
   - **Characteristics**: IP
   - **Threshold**: 10 requests per 1 minute
   - **Action**: Block

## Monitoring

1. View logs: `npx wrangler tail`
2. Check analytics in the Cloudflare dashboard under Workers & Pages

## Troubleshooting

### Build Errors
- Ensure all API routes have `export const runtime = 'edge';`
- Check that no Node.js-specific APIs are used in edge routes

### Deployment Errors
- Verify your API token has the correct permissions
- Check that wrangler.json is properly configured

### Runtime Errors
- Use `npx wrangler tail` to view real-time logs
- Check the Cloudflare dashboard for error metrics

## Local Development with Cloudflare

To test Cloudflare Workers locally:

```bash
npx wrangler dev
```

This will start a local server that emulates the Cloudflare Workers environment.

## Notes

- The application is configured to use Cloudflare's Edge Runtime
- Static assets are served from Cloudflare's CDN
- API routes run on Cloudflare Workers globally
- Rate limiting should be configured through Cloudflare's WAF