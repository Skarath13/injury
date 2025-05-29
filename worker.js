// Worker entry point for Next.js on Cloudflare
import workerCode from './.vercel/output/static/_worker.js/index.js';

export default {
  async fetch(request, env, ctx) {
    // Create a mock ASSETS binding if it doesn't exist
    if (!env.ASSETS) {
      env.ASSETS = {
        fetch: async (req) => {
          // For worker deployment, we need to handle static assets differently
          const url = new URL(req.url || req);
          const response = await fetch(url);
          return response;
        }
      };
    }
    
    // Call the original worker with the env that includes ASSETS
    return workerCode.fetch(request, env, ctx);
  }
};