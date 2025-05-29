// This file enables nodejs_compat for Cloudflare Pages
export const onRequest = async (context) => {
  // Pass through to the next middleware/function
  return context.next();
};