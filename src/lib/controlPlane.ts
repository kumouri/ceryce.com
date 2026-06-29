/**
 * Server-side client for the margo-control API. Runs ONLY in the Worker (admin pages are
 * server-rendered), so the bearer secret + Cloudflare Access service token never reach the
 * browser. Admin .astro pages call these directly in their frontmatter.
 */
import { env } from 'cloudflare:workers';

export interface RunLogRow {
  id: string;
  date: string;
  mode: string;
  status: string;
  itemsSurfaced?: number | null;
  actionsTaken?: string | null;
  draftsHeld?: number | null;
  summary?: string | null;
  carryOver?: string | null;
  notionUrl?: string | null;
}

export interface Approval {
  id: string;
  kind: string;
  channelRef: string;
  summary: string;
  bodyPreview: string;
  state: string;
  runId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AutonomyLevel = 'act-low' | 'ask-high';
export interface AutonomyConfig {
  version: number;
  globalMode: AutonomyLevel;
  channels: Record<string, { send?: AutonomyLevel; respond?: AutonomyLevel; trackerWrites?: AutonomyLevel }>;
  graduationLog?: Array<{ at: string; change: string }>;
}

export interface DashboardState {
  recentRuns: RunLogRow[];
  heldApprovals: Approval[];
  lastRun: RunLogRow | null;
  autonomy: AutonomyConfig;
  runnerLastSeen: string | null;
}

export interface Job {
  id: string;
  mode: string;
  status: string;
  result?: Record<string, unknown> | null;
  error?: string | null;
}

/** Thrown when the control plane isn't configured yet (pre-provisioning). */
export class ControlPlaneUnavailable extends Error {}

function baseUrl(): string {
  const url = env.CONTROL_PLANE_URL;
  if (!url) throw new ControlPlaneUnavailable('CONTROL_PLANE_URL is not set');
  return url.replace(/\/+$/, '');
}

function headers(adminEmail?: string, extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${env.DASH_API_SECRET ?? ''}`,
    ...extra,
  };
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    h['CF-Access-Client-Id'] = env.CF_ACCESS_CLIENT_ID;
    h['CF-Access-Client-Secret'] = env.CF_ACCESS_CLIENT_SECRET;
  }
  if (adminEmail) h['X-Admin-Email'] = adminEmail;
  return h;
}

async function req(path: string, init: RequestInit & { adminEmail?: string } = {}): Promise<Response> {
  const { adminEmail, headers: extra, ...rest } = init;
  const res = await fetch(`${baseUrl()}${path}`, {
    ...rest,
    headers: headers(adminEmail, (extra as Record<string, string>) ?? {}),
  });
  if (!res.ok) throw new Error(`margo-control ${path} → ${res.status} ${await res.text()}`);
  return res;
}

export async function getState(): Promise<DashboardState> {
  return (await req('/api/state')).json() as Promise<DashboardState>;
}

export async function enqueueJob(mode: string, payload: Record<string, unknown>, adminEmail: string): Promise<Job> {
  const res = await req('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, payload }),
    adminEmail,
  });
  return res.json() as Promise<Job>;
}

export async function getJob(id: string): Promise<Job> {
  return (await req(`/api/jobs/${encodeURIComponent(id)}`)).json() as Promise<Job>;
}

export async function decideApproval(id: string, action: 'approve' | 'reject', adminEmail: string): Promise<void> {
  await req(`/api/approvals/${encodeURIComponent(id)}/${action}`, { method: 'POST', adminEmail });
}

export async function getAutonomy(): Promise<AutonomyConfig> {
  return (await req('/api/autonomy')).json() as Promise<AutonomyConfig>;
}

export async function setAutonomy(config: AutonomyConfig): Promise<void> {
  await req('/api/autonomy', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}
