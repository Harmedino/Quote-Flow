// The QuoteFlow REST API as a single Vercel Function. vercel.json builds the
// API bundle (apps/api/dist) and routes every /api/* request here.
export { default } from '../../api/dist/vercel.js';
