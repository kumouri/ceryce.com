import { optInConfirmation, SMS_NUMBER } from './smsProgram';

// Illustration of the opt-in text exchange for /sms (A2P call-to-action evidence). It's generated
// from legal/sms-program.md rather than drawn by hand, so the confirmation reply in the picture is
// always word for word what the page publishes. Colors are the brand tokens from src/styles/tokens.css
// (an <img> SVG can't read CSS variables or load the site's webfonts, so they're inlined here).
const c = {
  bg: '#0a0810',
  surface: '#141020',
  surface2: '#1b1630',
  border: '#3d345e',
  text: '#ededf4',
  muted: '#a39fb8',
  purple: '#8e00ff',
  green: '#00ff0f',
};
const sans = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const mono = "ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word wrap. Kept conservative so no system sans font overflows the bubble. */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && line.length + 1 + word.length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function build() {
  const W = 400;
  const phone = { x: 30, y: 48, w: 340 };
  const lines = wrap(optInConfirmation, 29);
  const lh = 21;

  const reply = { x: 48, y: 256, w: 272, h: 30 + (lines.length - 1) * lh + 16 };
  const replyNote = reply.y + reply.h + 20;
  const phoneBottom = replyNote + 34;
  const H = phoneBottom + 40;

  const replyText = lines
    .map((l, i) => `<tspan x="${reply.x + 14}" y="${reply.y + 30 + i * lh}">${esc(l)}</tspan>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Illustration of the Margo SMS opt-in message flow</title>
<desc id="d">The owner texts START to ${esc(SMS_NUMBER)}. Margo replies: ${esc(optInConfirmation)}</desc>
<rect width="${W}" height="${H}" rx="12" fill="${c.bg}"/>
<text x="${W / 2}" y="30" text-anchor="middle" font-family="${mono}" font-size="12" letter-spacing="1.2" fill="${c.green}">ILLUSTRATION · OPT-IN MESSAGE FLOW</text>
<rect x="${phone.x}" y="${phone.y}" width="${phone.w}" height="${phoneBottom - phone.y}" rx="34" fill="${c.surface}" stroke="${c.border}" stroke-width="2"/>
<rect x="${W / 2 - 30}" y="${phone.y + 12}" width="60" height="6" rx="3" fill="${c.border}"/>
<circle cx="66" cy="106" r="18" fill="${c.purple}"/>
<text x="66" y="112" text-anchor="middle" font-family="${sans}" font-size="17" font-weight="700" fill="#ffffff">M</text>
<text x="94" y="100" font-family="${sans}" font-size="15" font-weight="700" fill="${c.text}">Margo SMS notifications</text>
<text x="94" y="117" font-family="${sans}" font-size="12" fill="${c.muted}">KMO Solutions Foundry LLC</text>
<text x="94" y="133" font-family="${mono}" font-size="12" fill="${c.muted}">${esc(SMS_NUMBER)}</text>
<line x1="${phone.x + 1}" x2="${phone.x + phone.w - 1}" y1="150" y2="150" stroke="${c.border}"/>
<text x="${W / 2}" y="174" text-anchor="middle" font-family="${sans}" font-size="11" fill="${c.muted}">Text message</text>
<rect x="266" y="188" width="86" height="38" rx="19" fill="${c.purple}"/>
<text x="309" y="212" text-anchor="middle" font-family="${mono}" font-size="15" font-weight="700" fill="#ffffff">START</text>
<text x="352" y="244" text-anchor="end" font-family="${sans}" font-size="11" fill="${c.muted}">Sent by the owner, from her own mobile</text>
<rect x="${reply.x}" y="${reply.y}" width="${reply.w}" height="${reply.h}" rx="16" fill="${c.surface2}" stroke="${c.green}" stroke-opacity="0.45"/>
<text font-family="${sans}" font-size="15" fill="${c.text}">${replyText}</text>
<text x="${reply.x}" y="${replyNote}" font-family="${sans}" font-size="11" fill="${c.muted}">Margo · automatic confirmation reply</text>
<rect x="${W / 2 - 50}" y="${phoneBottom - 16}" width="100" height="5" rx="2.5" fill="${c.border}"/>
<text x="${W / 2}" y="${phoneBottom + 26}" text-anchor="middle" font-family="${sans}" font-size="12" fill="${c.muted}">Owner-only program · no public sign-up</text>
</svg>
`;
  return { svg, width: W, height: H };
}

/** The opt-in illustration served at /sms-opt-in.svg (see src/pages/sms-opt-in.svg.ts). */
export const optInSvg = build();
