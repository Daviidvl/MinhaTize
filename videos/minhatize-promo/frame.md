---
version: alpha
name: MinhaTize Midnight Luxe — Frame (video / frame layer)
description: >
  Bespoke frame spec derived from the MinhaTize app design system (src/index.css). The unit is the
  frame (1080×1920 vertical). A deep midnight-navy stage lit by soft cobalt/sky glows, a single
  premium phone as hero, Inter in two registers (300 light display, 800 heavy accent), hairline
  rings, glass chips. Only the app's blue palette; teal/aqua reserved for progress and positive
  results. Luxury = restraint, depth, light, slow confident easing.
unit: the frame — 1080×1920 primary
principle: atoms are sacred · the phone is the hero · light, not color, carries luxury

colors:
  canvas: "#050B18"          # stage — darker than app dark-mode bg #060D1B
  canvas-2: "#0A1530"        # vignette mid
  navy: "#0B2545"
  midnight: "#162558"
  indigo: "#28195D"          # only inside g-midnight glow
  cobalt: "#1E5BB8"
  azure: "#3A86E0"
  sky: "#8FBDF0"
  ice: "#DCE9F9"
  mist: "#EEF4FC"
  text: "#F4F8FE"            # display text on stage
  text-muted: "rgba(220,233,249,0.62)"
  hairline: "rgba(143,189,240,0.22)"
  glass: "rgba(220,233,249,0.07)"
  glass-border: "rgba(143,189,240,0.24)"
  teal: "#19B5A5"            # progress / positive only
  aqua: "#2BD4C0"            # positive on dark only
  app-bg: "#F6F9FD"          # inside the phone (app light mode)
  app-surface: "#FFFFFF"
  app-ink: "#0B2545"
  app-ink-2: "#51657F"
  app-line: "#DDE6F1"

gradients:
  g-hero: "linear-gradient(135deg, #0B2545 0%, #1E5BB8 100%)"
  g-midnight: "linear-gradient(135deg, #162558 0%, #28195D 100%)"
  g-progress: "linear-gradient(90deg, #3A86E0 0%, #19B5A5 100%)"
  g-ring: "linear-gradient(135deg, #8FBDF0 0%, #2BD4C0 100%)"
  g-text-sheen: "linear-gradient(100deg, #DCE9F9 0%, #FFFFFF 40%, #8FBDF0 100%)"
  stage-glow: "radial-gradient(closest-side, rgba(30,91,184,0.55), rgba(22,37,88,0.25) 55%, transparent)"

radii:
  phone: "128px"
  screen: "112px"
  card: "34px"
  card-sm: "26px"
  chip: "999px"

typography:
  display-light: { fontFamily: "Inter", px: 112, weight: 300, lineHeight: 1.02, tracking: "-0.045em", color: "text" }
  display-heavy: { fontFamily: "Inter", px: 112, weight: 800, lineHeight: 1.0, tracking: "-0.05em", color: "text" }
  headline:      { fontFamily: "Inter", px: 76, weight: 300, lineHeight: 1.08, tracking: "-0.035em", color: "text" }
  headline-em:   { fontFamily: "Inter", px: 76, weight: 700, tracking: "-0.04em", fill: "g-text-sheen" }
  eyebrow:       { fontFamily: "Inter", px: 26, weight: 600, tracking: "0.32em", upper: true, color: "sky" }
  body:          { fontFamily: "Inter", px: 36, weight: 400, lineHeight: 1.4, color: "text-muted" }
  fine:          { fontFamily: "Inter", px: 22, weight: 500, tracking: "0.02em", color: "text-muted" }
  stat:          { fontFamily: "Inter", px: 160, weight: 800, tracking: "-0.06em", color: "text" }

spacing:
  safe-top: "220px"      # Reels UI keep-out
  safe-bottom: "380px"   # caption / buttons keep-out
  pad-x: "96px"

components:
  phone:
    size: "620×1290 at scale 1 (screen 572×1242)"
    body: "titanium graphite #1A2338→#0B1222 with 3px sky edge highlight, inner bezel black"
    island: "dynamic island pill 170×50 black"
    glass: "diagonal specular sweep (white 0→14%→0) crossing the screen once per frame"
    shadow: "0 120px 160px rgba(0,0,0,0.6), cobalt under-glow ellipse below"
    description: "THE hero. Screens inside are app light mode, rebuilt with the real app tokens."
  glass-chip:
    backgroundColor: "{colors.glass}"
    border: "1.5px solid {colors.glass-border}"
    rounded: "{radii.chip}"
    backdrop: "blur(18px)"
    description: "Floating callouts beside the phone; icon tile ice bg + cobalt icon (app rule)."
  float-card:
    backgroundColor: "rgba(255,255,255,0.96)"
    rounded: "{radii.card}"
    shadow: "0 40px 80px rgba(0,0,0,0.45)"
    description: "App cards that leave the phone and float in depth."
  hairline-ring:
    border: "1.5px solid {colors.hairline}"
    description: "Concentric orbit rings behind the phone / logo; slow rotation."
  light-sweep:
    description: "Soft anamorphic sky streak + bokeh dust (deterministic positions)."

---

# MinhaTize Midnight Luxe

## Overview

A night-time jewelry-ad register: a near-black navy stage, one object lit like a product shot. The
phone is always the hero; text is sparse, light-weight Inter set large, with one heavy or sheen-filled
word per line. Depth comes from glow, blur and parallax — never from extra colors.

## Do

- Use only the tokens above. Blue glows on the stage; the app's own screens in light mode inside the phone.
- Teal/aqua only for progress, rings, checks and "kg eliminados".
- Ease with expo/power3 out, long settles (0.9–1.4s). Nothing bounces cheaply; springs are subtle.
- Keep text inside the safe area (220px top, 380px bottom).

## Don't

- No purple/brown/coral; indigo only inside the g-midnight glow.
- No medical promises; the calculator always carries "uso educativo".
- No more than ~8 words on screen at once outside the phone.
