# Brand — Ceryce Armstrong

The personal brand for **ceryce.com** and Ceryce's identity across projects. This is the canonical
brand reference; the site implements it as CSS custom properties in
[`src/styles/tokens.css`](src/styles/tokens.css).

## Who it's for

Ceryce Armstrong (pronounced *"Cerise"*) — an Autistic Trans Woman with ADHD (she/her), a software
engineer of 10+ years moving into AI architecture and engineering. The brand should read as **technical,
confident, a little defiant, and unmistakably hers** — not a generic dev-portfolio template.

## Direction: neon-cyberpunk / glitch

Dark, terminal-adjacent surfaces lit by two high-voltage brand colors. Restrained most of the time, so
the neon actually *pops* when it appears. Glow, scanlines, and glitch are seasoning — never the whole
plate.

## Core colors

| Token | Hex | Role |
| --- | --- | --- |
| **Kumouri Purple** | `#8e00ff` | Primary. Identity, structural accents, glow, the `>` prompt. |
| **Toxic Green** | `#00ff0f` | Offset / accent. Links, focus rings, the blinking caret, "live" signal. |

These two are canonical and must not be substituted. Everything else is a neutral or a derived tint.

### Neutrals

Near-black with a faint purple cast, layered into surfaces:

`--bg #0a0810` · `--surface #141020` · `--surface-2 #1b1630` · `--border #2a2442` ·
text `--text #ededf4` / `--text-muted #a39fb8` / `--text-dim #6c6685`.

## Typography

Self-hosted via Fontsource (no third-party font requests — consistent with the privacy-minimal posture
of the legal pages).

- **Display** — Space Grotesk Variable. Headlines, the name, section titles.
- **Body** — Inter Variable. Paragraphs and long-form reading.
- **Mono** — JetBrains Mono Variable. Eyebrows, nav, labels, the wordmark, anything that should feel like
  a terminal.

## Motifs

- **Glow** — purple/green box- and text-shadows on key interactive elements (`--glow-purple`,
  `--glow-green`).
- **Terminal grid** — faint purple grid, masked to fade downward (`body::before`).
- **Scanlines** — a barely-there horizontal shimmer (`body::after`), dropped entirely for reduced motion.
- **Glitch** — RGB-split heading effect on hover/focus only (`GlitchHeading.astro`).
- **Wordmark** — `>ceryce_` with a purple prompt and a blinking green caret.

## Accessibility (non-negotiable)

This brand is bright by design, so contrast is handled deliberately:

- **Toxic Green `#00ff0f` on the dark base** is high-contrast and safe for body text, links, and small UI.
- **Kumouri Purple `#8e00ff`** does **not** pass small-text contrast on dark — reserve it for **large
  display text, borders, fills, icons, and glow**, never for body copy.
- White/off-white (`--text`) carries the actual reading load.
- Focus is **always** a visible green outline (`:focus-visible`).
- All motion (scanlines, glitch, blink, smooth scroll) is gated behind `prefers-reduced-motion`.
- A skip-to-content link is the first focusable element.

## Voice

Plain-spoken, precise, dry wit. Signal over noise. Proud about identity without making it a performance.
Lead with the point; cut the filler.
