// Shared reads of the canonical SMS-program Markdown (legal/sms-program.md), so the /sms page and
// the generated opt-in illustration (/sms-opt-in.svg) quote the exact same wording.
// Imported with Vite's `?raw` (inlined at build — the prerender runtime can't load node:fs).
import source from '../../legal/sms-program.md?raw';

export const smsProgramSource = source;

export const SMS_NUMBER = '(618) 726-8723';

/** The blockquote that follows `lead` in the Markdown, unwrapped to a single line. */
function quoteAfter(lead: string): string {
  const at = source.indexOf(lead);
  if (at === -1) throw new Error(`legal/sms-program.md: missing "${lead}"`);
  const lines = source.slice(at + lead.length).split('\n');
  const quote: string[] = [];
  for (const line of lines) {
    if (line.startsWith('>')) quote.push(line.replace(/^>\s?/, '').trim());
    else if (quote.length) break;
    else if (line.trim()) throw new Error(`legal/sms-program.md: no blockquote after "${lead}"`);
  }
  return quote.join(' ');
}

/** Margo's opt-in confirmation reply, word for word as registered and published on /sms. */
export const optInConfirmation = quoteAfter('Margo confirms the opt-in with this reply:');
