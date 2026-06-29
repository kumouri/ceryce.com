/**
 * Cloudflare Access JWT verification.
 *
 * Cloudflare Access sits in front of /admin/** at the edge and, on an authenticated
 * request, injects a signed JWT in the `Cf-Access-Jwt-Assertion` header (also mirrored
 * in the `CF_Authorization` cookie). We re-verify it inside the Worker as defense in
 * depth: even if the Access app were ever misconfigured or removed, the app refuses to
 * serve admin pages to an unverified caller.
 *
 * Verification uses `jose` (runtime-agnostic, works on workerd) against the team's
 * public JWKS. We do NOT hand-roll JWT crypto — this gate is security-critical.
 *
 * Docs: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

export interface AccessIdentity {
  email: string;
  /** The Access subject (user id), when present. */
  sub?: string;
}

export interface AccessConfig {
  /** e.g. "ceryce.cloudflareaccess.com" (no scheme). */
  teamDomain: string;
  /** The Access application's AUD tag (Application Audience). */
  aud: string;
}

/** The header Cloudflare Access sets on every authenticated request. */
export const ACCESS_JWT_HEADER = 'cf-access-jwt-assertion';
/** Fallback cookie carrying the same assertion. */
export const ACCESS_JWT_COOKIE = 'CF_Authorization';

// Cache one remote JWKS resolver per team domain. `createRemoteJWKSet` fetches the
// keys lazily, caches them, and refetches on key rotation / unknown `kid` (with its
// own cooldown), so this is safe to memoize for the life of the isolate.
const jwksByTeam = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(teamDomain: string) {
  let jwks = jwksByTeam.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksByTeam.set(teamDomain, jwks);
  }
  return jwks;
}

function emailFrom(payload: JWTPayload): string | undefined {
  const email = payload.email ?? payload['email'];
  return typeof email === 'string' ? email : undefined;
}

/**
 * Verify a Cloudflare Access assertion and return the caller's identity.
 * Throws if the token is missing, malformed, expired, wrong-audience, or unsigned by
 * the team's keys — callers should treat any throw as "deny".
 */
export async function verifyAccessJwt(
  token: string | undefined | null,
  { teamDomain, aud }: AccessConfig,
): Promise<AccessIdentity> {
  if (!token) throw new Error('No Cloudflare Access assertion present');
  if (!teamDomain || !aud) {
    throw new Error('Access not configured (missing ACCESS_TEAM_DOMAIN / ACCESS_AUD)');
  }

  const { payload } = await jwtVerify(token, jwksFor(teamDomain), {
    issuer: `https://${teamDomain}`,
    audience: aud,
  });

  const email = emailFrom(payload);
  if (!email) throw new Error('Access assertion has no email claim');

  return { email, sub: typeof payload.sub === 'string' ? payload.sub : undefined };
}

/** Pull the assertion from the request: header first, then the fallback cookie. */
export function readAccessToken(headers: Headers, cookieValue?: string): string | undefined {
  return headers.get(ACCESS_JWT_HEADER) ?? cookieValue ?? undefined;
}
