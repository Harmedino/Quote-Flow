// The QuoteFlow REST API as a single Vercel Function. vercel.json builds the
// bundle (apps/api/dist) and routes every /api/* request here.
export { default } from '../apps/api/dist/vercel.js';
