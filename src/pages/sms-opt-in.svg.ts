export const prerender = true; // Emitted at build as a static /sms-opt-in.svg asset.
import type { APIRoute } from 'astro';
import { optInSvg } from '../lib/smsOptInSvg';

export const GET: APIRoute = () =>
  new Response(optInSvg.svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
