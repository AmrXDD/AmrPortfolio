// graphify-style STRUCTURAL FALLBACK builder (no Python/graphifyy available).
// Parses real import edges from src/**.{ts,tsx} — this is filesystem+import
// structure, not native semantic extraction. Reproducible: `node graphify-out/build.mjs`.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, dirname, extname, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "graphify-out");
mkdirSync(OUT, { recursive: true });

// ---- collect source files -------------------------------------------------
const EXT = new Set([".ts", ".tsx"]);
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (EXT.has(extname(name))) acc.push(p);
  }
  return acc;
}
const files = walk(SRC);
const idOf = (abs) => relative(ROOT, abs).replace(/\\/g, "/");

// ---- classify a module ----------------------------------------------------
function subsystem(id) {
  if (id.startsWith("src/app/api/")) return "api";
  if (id.startsWith("src/app/admin/")) return "route:admin";
  if (/^src\/app\/\(site\)\//.test(id)) return "route:site";
  if (id.startsWith("src/app/")) return "app-root";
  if (id.startsWith("src/components/sections/")) return "sections";
  if (id.startsWith("src/components/ui/")) return "ui";
  if (id.startsWith("src/components/webgl/")) return "webgl";
  if (id.startsWith("src/components/providers/")) return "providers";
  if (id.startsWith("src/components/")) return "components";
  if (id.startsWith("src/lib/")) return "lib";
  return "other";
}
function kind(id, src) {
  const client = /^\s*["']use client["']/m.test(src);
  const server = /^\s*["']use server["']/m.test(src);
  if (/\/route\.ts$/.test(id)) return "route-handler";
  if (/\/page\.tsx?$/.test(id)) return "page";
  if (/\/layout\.tsx?$/.test(id)) return "layout";
  if (id.startsWith("src/lib/")) return "lib";
  if (/\.tsx$/.test(id)) return client ? "client-component" : "component";
  return server ? "server-module" : "module";
}

// ---- resolve an import specifier to an internal file id (or null) ---------
const CANDIDATES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];
const byId = new Map();
function resolveSpec(spec, fromAbs) {
  let baseAbs;
  if (spec.startsWith("@/")) baseAbs = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) baseAbs = resolve(dirname(fromAbs), spec);
  else return null; // external package
  for (const c of CANDIDATES) {
    const cand = idOf(baseAbs + c);
    if (byId.has(cand)) return cand;
  }
  return null;
}

// ---- parse imports --------------------------------------------------------
const nodes = [];
const raw = new Map(); // id -> { src, specs:Set }
for (const abs of files) {
  const id = idOf(abs);
  const src = readFileSync(abs, "utf8");
  byId.set(id, abs);
  raw.set(id, { abs, src });
}
for (const [id, { abs, src }] of raw) {
  nodes.push({ id, group: subsystem(id), kind: kind(id, src), label: id.split("/").pop() });
}

const STATIC_IMPORT = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT = /import\(\s*["']([^"']+)["']\s*\)/g;
const REQUIRE = /require\(\s*["']([^"']+)["']\s*\)/g;

const edges = [];
const extCount = new Map();
const seenEdge = new Set();
function addEdge(from, to, dynamic) {
  const k = `${from}->${to}`;
  if (seenEdge.has(k)) return;
  seenEdge.add(k);
  edges.push({ source: from, target: to, dynamic: !!dynamic });
}
for (const [id, { abs, src }] of raw) {
  const collect = (re, dyn) => {
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      const internal = resolveSpec(spec, abs);
      if (internal) addEdge(id, internal, dyn);
      else if (!spec.startsWith(".") && !spec.startsWith("@/")) {
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        extCount.set(pkg, (extCount.get(pkg) || 0) + 1);
      }
    }
  };
  collect(new RegExp(STATIC_IMPORT), false);
  collect(new RegExp(DYNAMIC_IMPORT), true);
  collect(new RegExp(REQUIRE), false);
}

// ---- metrics --------------------------------------------------------------
const indeg = new Map(), outdeg = new Map();
for (const n of nodes) { indeg.set(n.id, 0); outdeg.set(n.id, 0); }
for (const e of edges) {
  outdeg.set(e.source, (outdeg.get(e.source) || 0) + 1);
  indeg.set(e.target, (indeg.get(e.target) || 0) + 1);
}
for (const n of nodes) { n.in = indeg.get(n.id); n.out = outdeg.get(n.id); n.deg = n.in + n.out; }

const groups = {};
for (const n of nodes) (groups[n.group] ??= []).push(n);

const graph = {
  meta: {
    generator: "graphify-style structural fallback (Node import extractor)",
    native: false,
    scope: "src/",
    generatedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    note: "Edges are real static+dynamic import relationships. Not native graphify semantic extraction (no Python/graphifyy in env).",
  },
  nodes,
  edges,
  externalDeps: [...extCount.entries()].sort((a, b) => b[1] - a[1]).map(([name, uses]) => ({ name, uses })),
};
writeFileSync(join(OUT, "graph.json"), JSON.stringify(graph, null, 2));

// ---- GRAPH_REPORT.md ------------------------------------------------------
const topHubs = [...nodes].filter(n => n.in > 0).sort((a, b) => b.in - a.in).slice(0, 12);
const topFanout = [...nodes].sort((a, b) => b.out - a.out).slice(0, 10);
const orphans = nodes.filter(n => n.in === 0 && !/\/(page|layout|route)\.tsx?$/.test(n.id) && n.group !== "app-root");
const groupOrder = ["app-root", "route:site", "route:admin", "api", "sections", "components", "ui", "webgl", "providers", "lib", "other"];
const md = [];
md.push("# GRAPH_REPORT.md — Amr Studio portfolio (structural fallback)\n");
md.push(`> **Mode:** graphify-style **structural fallback** — native \`graphifyy\` (Python 3.10+) is not installed in this environment, so this graph is built from **real import edges** parsed out of \`src/**.{ts,tsx}\` by a Node extractor, not native semantic extraction.\n`);
md.push(`> **Scope:** \`src/\`  ·  **Nodes:** ${nodes.length} modules  ·  **Edges:** ${edges.length} import relationships  ·  Regenerate with \`node graphify-out/build.mjs\`.\n`);
md.push("## Subsystems\n");
md.push("| Group | Modules | What lives here |\n|---|---|---|");
const groupDesc = {
  "app-root": "Next.js App Router root — root layout, metadata, sitemap/robots/manifest/OG image",
  "route:site": "The public marketing site route group `(site)` — home page + its chrome layout",
  "route:admin": "Admin area — login form, dashboard, and the gated `/admin/contract` generator",
  "api": "Route handlers — contact form + admin login/logout endpoints",
  "sections": "Page sections composed into the home page (hero, showcase, process, contact, …)",
  "components": "Top-level chrome shared across the site (nav, preloader, top-controls, dock)",
  "ui": "Reusable UI + motion primitives (logo, magnetic, reveal, cursor, side-rays, …)",
  "webgl": "WebGL field backdrops (cosmic-field, space-field) and their mounts",
  "providers": "React context providers (theme, smooth-scroll)",
  "lib": "Shared non-UI logic (constants, i18n, supabase, admin-auth, helpers)",
  "other": "Uncategorized",
};
for (const g of groupOrder) {
  if (!groups[g]) continue;
  md.push(`| \`${g}\` | ${groups[g].length} | ${groupDesc[g] || ""} |`);
}
md.push("\n## Most-imported modules (hubs)\nThe shared foundation — changes here ripple widest.\n");
md.push("| Module | Imported by | Group | Kind |\n|---|---|---|---|");
for (const n of topHubs) md.push(`| \`${n.id}\` | ${n.in} | ${n.group} | ${n.kind} |`);
md.push("\n## Largest composers (fan-out)\nModules that pull in the most — the assembly points.\n");
md.push("| Module | Imports | Group | Kind |\n|---|---|---|---|");
for (const n of topFanout) md.push(`| \`${n.id}\` | ${n.out} | ${n.group} | ${n.kind} |`);
md.push("\n## Top external dependencies (by import sites)\n");
md.push("| Package | Import sites |\n|---|---|");
for (const d of graph.externalDeps.slice(0, 14)) md.push(`| \`${d.name}\` | ${d.uses} |`);
md.push(`\n## Modules with no internal importers (${orphans.length})\nEntry points, dynamically-loaded leaves, or dead ends. Not necessarily dead — dynamic \`import()\` and route files are legitimately \"unimported\".\n`);
md.push(orphans.slice(0, 30).map(n => `- \`${n.id}\``).join("\n") || "_none_");
md.push("\n\n## Artifacts\n- `graphify-out/GRAPH_REPORT.md` — this file (read first)\n- `graphify-out/graph.html` — interactive force-directed view (open in a browser)\n- `graphify-out/graph.json` — full node/edge data\n- `graphify-out/build.mjs` — the extractor (reproducible refresh)\n");
writeFileSync(join(OUT, "GRAPH_REPORT.md"), md.join("\n"));

// ---- graph.html (self-contained force-directed) ---------------------------
const palette = {
  "app-root": "#f5f5f5", "route:site": "#ff4d1f", "route:admin": "#ff8a4d", "api": "#e0245e",
  "sections": "#4da3ff", "components": "#22d3aa", "ui": "#a78bfa", "webgl": "#ffd24d",
  "providers": "#7dd3fc", "lib": "#9ca3af", "other": "#555",
};
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Amr Studio — structural graph</title>
<style>
 html,body{margin:0;height:100%;background:#0a0a0a;color:#eee;font:13px/1.4 ui-monospace,Menlo,monospace;overflow:hidden}
 #hud{position:fixed;top:12px;left:12px;z-index:5;max-width:280px}
 #hud h1{font-size:14px;margin:0 0 6px} #hud p{margin:2px 0;color:#aaa;font-size:11px}
 .leg{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
 .leg span{display:inline-flex;align-items:center;gap:4px;font-size:10px;color:#ccc}
 .dot{width:9px;height:9px;border-radius:50%}
 #tip{position:fixed;pointer-events:none;background:#151515;border:1px solid #333;padding:6px 8px;border-radius:6px;font-size:11px;display:none;z-index:6;max-width:320px}
 canvas{display:block}
</style></head><body>
<div id="hud"><h1>Amr Studio · structural graph</h1>
<p>${nodes.length} modules · ${edges.length} import edges · scope src/</p>
<p style="color:#ff8a4d">structural fallback (import parse), not native graphify</p>
<div class="leg" id="leg"></div></div>
<div id="tip"></div>
<canvas id="c"></canvas>
<script>
const G=${JSON.stringify({ nodes: nodes.map(n => ({ id: n.id, g: n.group, k: n.kind, in: n.in, out: n.out })), edges: edges.map(e => ({ s: e.source, t: e.target, d: e.dynamic })) })};
const COL=${JSON.stringify(palette)};
const leg=document.getElementById('leg');
[...new Set(G.nodes.map(n=>n.g))].forEach(g=>{const s=document.createElement('span');s.innerHTML='<span class="dot" style="background:'+(COL[g]||'#888')+'"></span>'+g;leg.appendChild(s);});
const c=document.getElementById('c'),x=c.getContext('2d');let W,H;
function size(){W=c.width=innerWidth;H=c.height=innerHeight;}size();addEventListener('resize',size);
const idx=new Map(G.nodes.map((n,i)=>[n.id,i]));
const N=G.nodes.map((n,i)=>({...n,x:W/2+Math.cos(i)*300*Math.random(),y:H/2+Math.sin(i)*300*Math.random(),vx:0,vy:0,r:3+Math.sqrt(n.in)*1.6}));
const E=G.edges.map(e=>({s:idx.get(e.s),t:idx.get(e.t),d:e.d})).filter(e=>e.s!=null&&e.t!=null);
let cx=W/2,cy=H/2,zoom=1,drag=null,hover=null;
function tick(){
 for(const a of N){a.vx*=.86;a.vy*=.86;}
 for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++){const a=N[i],b=N[j];let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy||1;if(d2<90000){const f=1400/d2;const d=Math.sqrt(d2);dx/=d;dy/=d;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;}}
 for(const e of E){const a=N[e.s],b=N[e.t];let dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1;const f=(d-70)*.008;dx/=d;dy/=d;a.vx+=dx*f;a.vy+=dy*f;b.vx-=dx*f;b.vy-=dy*f;}
 for(const a of N){a.vx+=(W/2-a.x)*.0012;a.vy+=(H/2-a.y)*.0012;if(a!==drag){a.x+=a.vx;a.y+=a.vy;}}
}
function draw(){
 x.setTransform(zoom,0,0,zoom,cx-W/2*zoom+ (W/2-cx)*0,cy-H/2*zoom);
 x.clearRect(-W,-H,W*3,H*3);
 x.lineWidth=.5;
 for(const e of E){const a=N[e.s],b=N[e.t];x.strokeStyle=e.d?'rgba(255,140,77,.35)':'rgba(255,255,255,.09)';x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();}
 for(const a of N){x.fillStyle=COL[a.g]||'#888';x.globalAlpha=hover&&hover!==a?.35:1;x.beginPath();x.arc(a.x,a.y,a.r,0,7);x.fill();}
 x.globalAlpha=1;
}
function loop(){tick();draw();requestAnimationFrame(loop);}loop();
const tip=document.getElementById('tip');
c.addEventListener('mousemove',ev=>{
 if(drag){const mx=(ev.clientX-cx)/zoom+W/2,my=(ev.clientY-cy)/zoom+H/2;drag.x=mx;drag.y=my;drag.vx=drag.vy=0;return;}
 const mx=(ev.clientX-cx)/zoom+W/2,my=(ev.clientY-cy)/zoom+H/2;hover=null;
 for(const a of N){if((a.x-mx)**2+(a.y-my)**2<(a.r+4)**2){hover=a;break;}}
 if(hover){tip.style.display='block';tip.style.left=ev.clientX+12+'px';tip.style.top=ev.clientY+12+'px';tip.innerHTML='<b>'+hover.id+'</b><br>'+hover.g+' · '+hover.k+'<br>imported by '+hover.in+' · imports '+hover.out;}else tip.style.display='none';
});
c.addEventListener('mousedown',ev=>{const mx=(ev.clientX-cx)/zoom+W/2,my=(ev.clientY-cy)/zoom+H/2;for(const a of N)if((a.x-mx)**2+(a.y-my)**2<(a.r+4)**2){drag=a;return;}drag={pan:1,px:ev.clientX,py:ev.clientY,cx,cy};});
addEventListener('mouseup',()=>drag=null);
c.addEventListener('mousemove',ev=>{if(drag&&drag.pan){cx=drag.cx+(ev.clientX-drag.px);cy=drag.cy+(ev.clientY-drag.py);}},true);
c.addEventListener('wheel',ev=>{ev.preventDefault();zoom*=ev.deltaY<0?1.1:.9;zoom=Math.max(.2,Math.min(4,zoom));},{passive:false});
</script></body></html>`;
writeFileSync(join(OUT, "graph.html"), html);

console.log(`OK nodes=${nodes.length} edges=${edges.length} ext=${graph.externalDeps.length}`);
console.log("Top hubs:", topHubs.slice(0, 5).map(n => `${n.label}(${n.in})`).join(", "));
