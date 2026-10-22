#!/usr/bin/env node
// Builds compositions/frames/*.html (HyperFrames sub-compositions) and storyboard.html
// from kit/kit.css + kit/parts/*.part + kit/frames/*.src, so sketch and build share one layout.
// Usage: node kit/build.mjs [--frames] [--sheet]   (default: both)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = dirname(fileURLToPath(import.meta.url));
const ROOT = join(KIT, "..");
const args = process.argv.slice(2);
const doFrames = !args.length || args.includes("--frames");
const doSheet = !args.length || args.includes("--sheet");
const SHEET_VERSION = (args.find((a) => a.startsWith("--v=")) || "--v=1").slice(4);

const read = (p) => readFileSync(p, "utf8");
const kitCss = read(join(KIT, "kit.css"));
const part = (name) => read(join(KIT, "parts", `${name}.part`));

// ── Icons (Lucide, ISC) ───────────────────────────────────────────
const ICONS = {
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7M7 16h10"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  dumbbell: '<path d="M6.5 6.5 17.5 17.5M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  syringe: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
  trend: '<path d="M22 17 13.5 8.5l-5 5L2 7"/><path d="M16 17h6v-6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  calculator: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  userx: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5M22 8l-5 5"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  note: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/>',
};
const icon = (n, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${ICONS[n] ?? ""}</svg>`;

// ── Deterministic PRNG (build time only) ──────────────────────────
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const NAV = [["home", "Início"], ["trend", "Progresso"], ["heart", "Saúde"], ["calculator", "Calcular"], ["flask", "Lab"]];
const nav = (on) =>
  `<div class="mt-a-nav">${NAV.map(([i, l], k) => `<div class="${k === on ? "mt-on" : ""}">${icon(i)}${l}</div>`).join("")}</div>`;

function calendar() {
  const wd = ["D", "S", "T", "Q", "Q", "S", "S"].map((d) => `<div class="mt-wd">${d}</div>`).join("");
  let cells = "";
  for (let i = 0; i < 4; i++) cells += `<div class="mt-d"></div>`;
  for (let d = 1; d <= 31; d++) {
    let cls = "mt-d";
    if (d === 1 || d === 8) cls += " mt-done";
    else if (d === 15) cls += " mt-today";
    else if (d === 22 || d === 29) cls += " mt-plan";
    else if (d < 15) cls += " mt-past";
    cells += `<div class="${cls} mt-day mt-day-${d}"><i class="mt-dm"></i><span>${d}</span></div>`;
  }
  return wd + cells;
}

const htile = (ic, title, sub) =>
  `<div class="mt-a-card mt-htile" style="padding:13px;height:84px"><div class="mt-a-ico" style="margin-bottom:9px">${icon(ic)}</div><div style="font-size:13px;font-weight:800;letter-spacing:-.3px">${title}</div><div style="font-size:10px;color:#51657F;margin-top:2px">${sub}</div></div>`;

function homegrid() {
  const colors = ["#3A86E0", "#DCE9F9", "#8FBDF0", "#1E5BB8", "#EEF4FC", "#8FBDF0", "#3A86E0", "#DCE9F9", "#1E5BB8", "#EEF4FC", "#8FBDF0", "#3A86E0", "#DCE9F9", "#1E5BB8", "#8FBDF0", "#EEF4FC"];
  const names = ["Fotos", "Mapas", "Clima", "Notas", "Música", "Relógio", "Câmera", "Agenda", "Saúde", "Mail", "Lembretes", "Arquivos", "Ajustes", "Banco", "Podcasts", "Livros"];
  let out = "";
  for (let i = 0; i < 16; i++) {
    if (i === 9) {
      out += `<div class="mt-home-app mt-home-mt"><div class="mt-home-slot"><img class="mt-home-icon" src="assets/logo-mark.png" alt=""></div><span style="font-weight:700;color:#fff">MinhaTize</span></div>`;
      continue;
    }
    out += `<div class="mt-home-app"><i style="background:${colors[i]};opacity:${0.55 + (i % 3) * 0.12}"></i><span>${names[i]}</span></div>`;
  }
  return out;
}

function dust(n, seed, w = 1080, h = 1920) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const s = 2 + r() * 5;
    out += `<i style="left:${(r() * w).toFixed(0)}px;top:${(r() * h).toFixed(0)}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;opacity:${(0.15 + r() * 0.5).toFixed(2)};${s > 5 ? "filter:blur(1.5px);" : ""}"></i>`;
  }
  return `<div class="mt-dust" data-layout-allow-overflow>${out}</div>`;
}

const SCREENS = { dashboard: "screen-dashboard", calendar: "screen-calendar", calculator: "screen-calculator", health: "screen-health", home: "screen-home" };

function expand(src) {
  let out = src;
  for (let pass = 0; pass < 4; pass++) {
    out = out
      .replace(/\{\{phone:(\w+)(?::(dark))?\}\}/g, (_, s, dark) =>
        part("phone").replace("{{SCREEN}}", part(SCREENS[s])).replace("{{STATUS}}", dark ? "mt-dark" : ""))
      .replace(/\{\{icon:(\w+)\}\}/g, (_, n) => icon(n))
      .replace(/\{\{nav:(\d)\}\}/g, (_, i) => nav(+i))
      .replace(/\{\{calendar\}\}/g, calendar)
      .replace(/\{\{homegrid\}\}/g, homegrid)
      .replace(/\{\{htile:(\w+):([^:}]+):([^}]+)\}\}/g, (_, i, t, s) => htile(i, t, s))
      .replace(/\{\{dust:(\d+):(\d+)\}\}/g, (_, n, s) => dust(+n, +s))
      .replace(/\{\{logo:(\d+)\}\}/g, (_, size) =>
        `<div class="mt-logo" style="width:${size}px;height:${size}px"><img src="assets/logo-mark.png" alt=""></div>`)
      .replace(/\{\{stagebg\}\}/g, () =>
        `<div class="mt-bg"></div><div class="mt-glow2" data-layout-allow-overflow></div><div class="mt-glow" data-layout-allow-overflow></div>`);
  }
  return out;
}

// ── Frame sources ─────────────────────────────────────────────────
function parseSrc(file) {
  const raw = read(join(KIT, "frames", file));
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw.replace(/\r\n/g, "\n"));
  const meta = {};
  fm[1].split("\n").forEach((l) => {
    const m = /^(\w+):\s*(.*)$/.exec(l);
    if (m) meta[m[1]] = m[2].trim();
  });
  const body = raw.replace(/\r\n/g, "\n").slice(fm[0].length);
  const sec = (name) => {
    const m = new RegExp(`<!--${name}-->([\\s\\S]*?)(?=<!--[A-Z]+-->|$)`).exec(body);
    return m ? m[1].trim() : "";
  };
  return { ...meta, css: sec("CSS"), html: sec("HTML"), js: sec("JS"), note: sec("NOTE"), sketchCss: sec("SKETCHCSS") };
}

const fontFace = [300, 400, 500, 600, 700, 800]
  .map((w) => `@font-face{font-family:"Inter";font-style:normal;font-weight:${w};font-display:block;src:url("assets/fonts/inter-latin-${w}-normal.woff2") format("woff2");}`)
  .join("\n");
const LOGO_CSS = `.mt-logo{position:relative;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px rgba(143,189,240,0.35),0 30px 80px rgba(30,91,184,0.55);}
.mt-logo img{position:absolute;left:-6%;top:-6%;width:112%;height:112%;object-fit:cover;}
.mt-home-slot{width:58px;height:58px;border-radius:16px;overflow:hidden;position:relative;background:#0B2545;box-shadow:0 0 0 2px rgba(255,255,255,.9),0 10px 30px rgba(143,189,240,.6);}
.mt-home-icon{position:absolute;left:-4px;top:-4px;width:66px;height:66px;}`;

const prefixed = (s, p) => s.replace(/mt-/g, `${p}-`);

const frames = readdirSync(join(KIT, "frames")).filter((f) => f.endsWith(".src")).sort().map(parseSrc);

if (doFrames) {
  mkdirSync(join(ROOT, "compositions", "frames"), { recursive: true });
  for (const f of frames) {
    const p = f.prefix;
    const css = prefixed(`${kitCss}\n${LOGO_CSS}\n${f.css}`, p);
    const html = prefixed(expand(f.html), p);
    const js = prefixed(f.js, p);
    const out = `<template>
<style>
${fontFace}
#root { position:absolute; inset:0; width:100%; height:100%; overflow:hidden; font-family:Inter, sans-serif; }
${css}
</style>
<div id="root" data-composition-id="${f.id}" data-width="1080" data-height="1920">
<div id="${p}-stage" class="${p}-stage clip" data-start="0" data-duration="${f.duration}" data-track-index="0">
${html}
</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
(function () {
  const tl = gsap.timeline({ paused: true });
  const fmt = (v, d) => v.toFixed(d).replace(".", ",");
  const count = (sel, from, to, d, at, dur, ease) => {
    const els = document.querySelectorAll(sel);
    const o = { v: from };
    tl.fromTo(o, { v: from }, { v: to, duration: dur, ease: ease || "power3.out",
      onUpdate: () => els.forEach((e) => (e.textContent = fmt(o.v, d))) }, at);
  };
${js
  .split("\n")
  .map((l) => "  " + l)
  .join("\n")}
  window.__timelines["${f.id}"] = tl;
})();
</script>
</template>
`;
    writeFileSync(join(ROOT, "compositions", "frames", `${f.id}.html`), out);
    console.log(`frame ${f.id} (${f.duration}s) → compositions/frames/${f.id}.html`);
  }
}

if (doSheet) {
  let t = 0;
  const cells = frames
    .map((f) => {
      const p = f.prefix;
      const start = t;
      t += parseFloat(f.duration);
      return `<figure class="cell" id="frame-${f.id.slice(0, 2)}">
  <div class="art"><div class="zoom"><div class="sk ${p}-stage">${prefixed(expand(f.html), p)}</div></div></div>
  <figcaption>
    <div class="row"><b>${f.id.slice(0, 2)} · ${f.title}</b><span>${f.id} · ${start.toFixed(1)}–${t.toFixed(1)}s</span></div>
    <p>${f.note}</p>
    <span class="chip">entra com ${f.transition}</span>
  </figcaption>
</figure>`;
    })
    .join("\n");
  const css = frames.map((f) => prefixed(`${kitCss}\n${LOGO_CSS}\n${f.css}\n${f.sketchCss}`, f.prefix)).join("\n");
  const seam = frames.map((f) => `<li><b>${f.id.slice(0, 2)}</b> ${f.transition}</li>`).join("");
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MinhaTize — Storyboard v${SHEET_VERSION}</title>
<style>
${fontFace}
:root{--bg:#04080F;--ink:#F4F8FE;--mute:rgba(220,233,249,.62);--line:rgba(143,189,240,.18);--sky:#8FBDF0}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:Inter,sans-serif;padding:48px 40px 80px}
header{max-width:1500px;margin:0 auto 36px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:24px}
header h1{font-weight:300;font-size:44px;letter-spacing:-.03em}header h1 b{font-weight:800}
header p{color:var(--mute);font-size:16px;margin-top:8px;max-width:760px;line-height:1.5}
.tag{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--sky);border:1px solid var(--line);border-radius:99px;padding:8px 16px;white-space:nowrap}
.grid{max-width:1500px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,360px);justify-content:center;gap:36px 28px}
.cell{background:#081022;border:1px solid var(--line);border-radius:22px;overflow:hidden}
.art{position:relative;width:100%;aspect-ratio:9/16;overflow:hidden}
.zoom{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;transform:scale(0.333333)}
.sk{position:absolute;inset:0;width:1080px;height:1920px}
figcaption{padding:16px 18px 20px}
.row{display:flex;justify-content:space-between;gap:8px;font-size:13px}.row b{font-weight:800;letter-spacing:.02em}.row span{color:var(--mute);font-size:12px}
figcaption p{color:var(--mute);font-size:13.5px;line-height:1.55;margin:10px 0 12px}figcaption p b{color:var(--ink)}
.chip{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sky);background:rgba(143,189,240,.1);border-radius:99px;padding:5px 11px}
.meta{padding:22px}.meta h3{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--sky);margin-bottom:14px}
.meta ul{list-style:none;display:grid;gap:8px;font-size:14px;color:var(--mute)}.meta li b{color:var(--ink);margin-right:8px}
.sw{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.sw i{width:38px;height:38px;border-radius:10px;display:block;border:1px solid var(--line)}
</style>
<style>
${css}
</style></head>
<body>
<header>
  <div><h1><b>MinhaTize</b> — apresentação do app · storyboard v${SHEET_VERSION}</h1>
  <p>Esboços estáticos de cada cena no momento-chave, com fontes, cores e textos reais. O celular aparece reto aqui; a inclinação 3D, os brilhos e as contagens entram na versão animada.</p></div>
  <span class="tag">1080×1920 · ${t.toFixed(1)}s · ${frames.length} cenas · sem áudio</span>
</header>
<main class="grid">
${cells}
<figure class="cell meta"><h3>Costuras entre cenas</h3><ul>${seam}</ul></figure>
<figure class="cell meta"><h3>Tokens</h3>
<div class="sw"><i style="background:#050B18"></i><i style="background:#0B2545"></i><i style="background:#162558"></i><i style="background:#1E5BB8"></i><i style="background:#3A86E0"></i><i style="background:#8FBDF0"></i><i style="background:#DCE9F9"></i><i style="background:#19B5A5"></i><i style="background:#2BD4C0"></i></div>
<ul><li><b>Display</b>Inter 300, −0.045em</li><li><b>Ênfase</b>Inter 700–800 com brilho</li><li><b>Teal</b>só progresso e resultado positivo</li><li><b>Proibido</b>roxo/marrom/coral, promessa médica</li></ul></figure>
</main>
</body></html>
`;
  writeFileSync(join(ROOT, "storyboard.html"), html);
  console.log(`storyboard.html v${SHEET_VERSION} (${frames.length} cells, ${t.toFixed(1)}s)`);
}
