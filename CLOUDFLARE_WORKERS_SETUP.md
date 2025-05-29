# Cloudflare Workers Setup Guide

This guide explains how to deploy the California Auto Injury Settlement Calculator using Cloudflare Workers for the API routes.

## Architecture Overview

- **Frontend**: Next.js app deployed to Cloudflare Pages or Vercel
- **API**: Cloudflare Workers handling the `/api/calculate` endpoint
- **Benefits**: Global edge deployment, better scalability, built-in DDoS protection

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Local Development

To run the Cloudflare Worker locally:

```bash
npm run dev:worker
```

This will start the worker on http://localhost:8787

To run the Next.js app with the local worker:

1. Start the worker: `npm run dev:worker`
2. In another terminal: `npm run dev`
3. The app will use the worker endpoint defined in `.env.local`

### 4. Deploy the Worker

```bash
npm run deploy:worker
```

This will deploy the worker to Cloudflare's edge network.

### 5. Update Environment Variables

After deployment, update your `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=https://california-injury-calculator.YOUR-SUBDOMAIN.workers.dev
```

### 6. Deploy the Frontend

You can deploy the frontend to:

#### Option A: Cloudflare Pages
```bash
npm run deploy:cloudflare
```

#### Option B: Vercel (or other providers)
```bash
vercel
```

## Environment Configuration

### Development
- Worker URL: `http://localhost:8787`
- Next.js URL: `http://localhost:3000`

### Production
- Worker URL: `https://california-injury-calculator.YOUR-SUBDOMAIN.workers.dev`
- Frontend URL: Your custom domain

## API Endpoints

### POST /api/calculate
Calculates the settlement estimate based on form data.

**Request Body**: InjuryCalculatorData object
**Response**: SettlementResult object

## Rate Limiting

Configure rate limiting in the Cloudflare dashboard:

1. Go to your Worker
2. Navigate to Security > Rate Limiting
3. Create a rule for `/api/calculate`
4. Set threshold (e.g., 10 requests per minute)

## Monitoring

View real-time logs:
```bash
npm run worker:tail
```

Check analytics in the Cloudflare dashboard under Workers & Pages.

## Troubleshooting

### CORS Issues
The worker includes CORS headers. If you still face issues:
1. Check the `Access-Control-Allow-Origin` header in the worker
2. Ensure your frontend URL is allowed

### 500 Errors
1. Check worker logs: `npm run worker:tail`
2. Verify all required fields are in the request
3. Check for TypeScript errors in the worker

### Local Development Issues
1. Ensure both worker and Next.js dev servers are running
2. Check `.env.local` has correct worker URL
3. Clear browser cache if needed

## Security Notes

1. The worker validates all input data
2. No sensitive data is logged
3. CORS is configured to allow specific origins in production
4. Rate limiting prevents abuse

## Cost Considerations

Cloudflare Workers pricing:
- First 100,000 requests/day are free
- $0.50 per million requests after that
- No charge for bandwidth

For this calculator, the free tier should be sufficient for most use cases.