/* ==========================================================
   Leitor de brand kit — solte um PDF, imagem, SVG ou texto e a
   identidade visual do cliente é preenchida sozinha.
   - Modo local (sem internet de IA): lê códigos HEX/RGB/CMYK,
     cores das páginas, nomes de fontes, tom de voz e regras.
   - Modo IA (opcional): envia o arquivo para a Claude, que
     devolve tudo estruturado. Precisa de uma chave da API.
   ========================================================== */
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const ANTHROPIC_SDK = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.65.0/+esm';
const AI_KEY = 'nucleo.ai';
const ROLES = ['primária', 'secundária', 'destaque', 'fundo', 'texto'];
const KNOWN_FONTS = ['Playfair Display', 'Cormorant Garamond', 'Cormorant', 'Montserrat', 'Poppins', 'Inter', 'DM Sans', 'DM Serif Display', 'Roboto', 'Open Sans', 'Lato', 'Raleway', 'Nunito', 'Sora', 'Clash Display', 'Bebas Neue', 'Anton', 'Oswald', 'Fraunces', 'Lora', 'Merriweather', 'Libre Baskerville', 'Bodoni', 'Didot', 'Garamond', 'Helvetica', 'Helvetica Neue', 'Arial', 'Futura', 'Gotham', 'Avenir', 'Avenir Next', 'Proxima Nova', 'Bricolage Grotesque', 'Space Grotesk', 'Archivo', 'Manrope', 'Outfit', 'Urbanist', 'Quicksand', 'Josefin Sans', 'Work Sans', 'Rubik', 'Karla', 'Mulish', 'Source Sans Pro', 'Source Serif', 'Satoshi', 'General Sans', 'Gilroy', 'Glacial Indifference', 'League Spartan', 'Kollektif', 'Great Vibes', 'Parisienne', 'Allura', 'Dancing Script', 'Pacifico', 'Sacramento', 'Alex Brush', 'Bon Vivant', 'Brittany Signature', 'Canva Sans', 'Abril Fatface', 'Cinzel', 'Tenor Sans', 'Italiana', 'Syne', 'Unbounded', 'Epilogue', 'Plus Jakarta Sans', 'Lexend', 'Barlow', 'Fira Sans', 'PT Serif', 'Prata', 'Marcellus', 'Bellefair', 'Questrial', 'Comfortaa'];

const aiConf = () => { try { return JSON.parse(localStorage.getItem(AI_KEY)) || {}; } catch (e) { return {}; } };
function loadScript(src) {
  return new Promise((ok, bad) => { if ([...document.scripts].some(s => s.src === src)) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => bad(new Error('Não consegui carregar ' + src)); document.head.appendChild(s); });
}
const fileToB64 = f => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = bad; r.readAsDataURL(f); });
const fileToDataURL = f => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = bad; r.readAsDataURL(f); });

/* ---------- interface ---------- */
function brandDropzone(cid) {
  const ai = aiConf();
  return `<div class="card brand-drop" id="brand-drop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');readBrandFiles(event.dataTransfer.files,'${cid}')">
    <div class="bd-ico">${icon('sparkle')}</div>
    <div class="grow"><h3>Solte aqui o manual da marca</h3>
      <p class="small muted" style="margin:4px 0 0">PDF, imagem do logo, SVG ou texto. O sistema lê o arquivo e atualiza paleta, fontes, tom de voz e regras de uso sozinho — você pode desfazer depois.</p>
      <div class="small" style="margin-top:8px">${ai.key ? `<span class="pill ok">IA ligada · Claude</span>` : `<span class="pill nodot">Leitura automática local</span>`} <a href="javascript:void 0" onclick="formAI()">${ai.key ? 'configurar IA' : 'ligar IA para uma leitura mais inteligente'}</a></div></div>
    <label class="btn primary">${icon('download').replace('<svg', '<svg style="transform:rotate(180deg)"')} Escolher arquivo<input type="file" multiple hidden accept=".pdf,image/*,.svg,.txt,.md,.json,.css" onchange="readBrandFiles(this.files,'${cid}')"></label>
  </div>`;
}
function formAI() {
  const c = aiConf();
  openForm({
    title: 'Ligar a IA do leitor de brand kit', fields: [
      { k: 'key', label: 'Chave da API da Anthropic (Claude)', type: 'password', value: c.key || '', full: true, ph: 'sk-ant-…' },
    ], submit: 'Salvar', extra: `<p class="small muted" style="margin:12px 0 0">Com a chave, o arquivo é enviado para a Claude (${'claude-opus-5-5'}), que lê o manual inteiro — inclusive imagens — e devolve a identidade organizada. A chave fica salva só neste navegador; use uma chave sua, com limite de gastos. Deixe em branco para usar só a leitura local, que não envia nada para fora.</p>`,
    onSubmit: v => { try { localStorage.setItem(AI_KEY, JSON.stringify({ key: (v.key || '').trim() })); } catch (e) { } toast(v.key ? 'IA ligada' : 'IA desligada — usando leitura local'); }
  });
}
function brandProgress(msg) {
  const el = document.getElementById('brand-drop'); if (!el) return;
  el.classList.add('busy'); el.querySelector('h3').textContent = msg;
}

/* ---------- fluxo principal ---------- */
async function readBrandFiles(fileList, cid) {
  const files = [...(fileList || [])]; if (!files.length) return;
  const c = client(cid); const ai = aiConf();
  try {
    brandProgress(`Lendo ${files.length > 1 ? files.length + ' arquivos' : '“' + files[0].name + '”'}…`);
    const parts = [];
    for (const f of files) parts.push(await extractFile(f));
    let result, via;
    if (ai.key) {
      try { brandProgress('A IA está analisando o manual…'); result = await analyzeWithClaude(files, parts, c, ai.key); via = 'IA (Claude)'; }
      catch (e) { console.warn(e); toast('A IA não respondeu (' + (e.message || 'erro') + '). Usei a leitura local.', 'alert'); }
    }
    if (!result) { result = analyzeLocal(parts); via = 'leitura local'; }
    const logo = parts.find(p => p.logo)?.logo;
    if (logo && !result.logoImg) result.logoImg = logo;
    applyBrand(cid, result, via, files.map(f => f.name));
  } catch (e) {
    console.error(e); toast('Não consegui ler o arquivo: ' + (e.message || e), 'alert'); route();
  }
}

/* extrai texto e cores de cada tipo de arquivo */
async function extractFile(f) {
  const name = f.name.toLowerCase();
  if (f.type === 'application/pdf' || name.endsWith('.pdf')) return extractPdf(f);
  if (f.type === 'image/svg+xml' || name.endsWith('.svg')) {
    const text = await f.text(); const url = await fileToDataURL(f);
    return { kind: 'svg', name: f.name, text, colors: await imageColors(url), logo: url };
  }
  if (f.type.startsWith('image/')) {
    const url = await fileToDataURL(f);
    return { kind: 'image', name: f.name, text: '', colors: await imageColors(url), logo: await shrinkImage(url, 320) };
  }
  return { kind: 'text', name: f.name, text: await f.text(), colors: [] };
}
async function extractPdf(f) {
  await loadScript(PDFJS_URL);
  const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
  let text = ''; const colorBag = {};
  const pages = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= pages; i++) {
    brandProgress(`Lendo a página ${i} de ${pdf.numPages}…`);
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    text += tc.items.map(it => it.str + (it.hasEOL ? '\n' : ' ')).join('') + '\n\n';
    if (i <= 12) { // cores visíveis nas primeiras páginas
      const vp = page.getViewport({ scale: 0.35 }); const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      countColors(cv, colorBag);
    }
  }
  return { kind: 'pdf', name: f.name, text, colors: topColors(colorBag, 8), pages: pdf.numPages };
}
function countColors(cv, bag) {
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  for (let i = 0; i < d.length; i += 8) {
    if (d[i + 3] < 128) continue;
    const k = [d[i], d[i + 1], d[i + 2]].map(v => Math.min(255, Math.round(v / 24) * 24)).join(',');
    bag[k] = (bag[k] || 0) + 1;
  }
}
function topColors(bag, n) {
  const sorted = Object.entries(bag).sort((a, b) => b[1] - a[1]).map(([k]) => '#' + k.split(',').map(v => (+v).toString(16).padStart(2, '0')).join('').toUpperCase());
  return dedupe(sorted).slice(0, n);
}
function imageColors(url) {
  return new Promise(ok => { const img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 80; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, 80, 80); const bag = {}; countColors(cv, bag); ok(topColors(bag, 6)); }; img.onerror = () => ok([]); img.src = url; });
}
function shrinkImage(url, max) {
  return new Promise(ok => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); ok(cv.toDataURL('image/png')); }; img.onerror = () => ok(null); img.src = url; });
}

/* ---------- utilidades de cor ---------- */
const dist = (a, b) => { const x = hexToRgb(a), y = hexToRgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
function dedupe(list) { const out = []; list.forEach(h => { if (h && !out.some(o => dist(o, h) < 28)) out.push(h); }); return out; }
const lum = h => { const [r, g, b] = hexToRgb(h); return (r * 299 + g * 587 + b * 114) / 255000; };
const sat = h => { const [r, g, b] = hexToRgb(h); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
function assignRoles(list) {
  // list: [{hex,name}] na ordem em que aparecem no manual
  const items = list.map(x => ({ ...x }));
  const pick = fn => { const i = items.findIndex(x => !x.role && fn(x)); if (i >= 0) return items[i]; };
  const sortedL = [...items].sort((a, b) => lum(b.hex) - lum(a.hex));
  const bg = sortedL[0] && lum(sortedL[0].hex) > .9 ? sortedL[0] : null; if (bg) bg.role = 'fundo';
  const tx = sortedL[sortedL.length - 1] && lum(sortedL[sortedL.length - 1].hex) < .22 && sortedL[sortedL.length - 1] !== bg ? sortedL[sortedL.length - 1] : null; if (tx) tx.role = 'texto';
  const prim = pick(() => true); if (prim) prim.role = 'primária';
  const rest = items.filter(x => !x.role).sort((a, b) => sat(b.hex) - sat(a.hex));
  if (rest[0]) rest[0].role = 'destaque';
  items.filter(x => !x.role).forEach(x => x.role = 'secundária');
  if (tx && !prim) tx.role = 'primária';
  const order = r => ROLES.indexOf(r);
  return items.sort((a, b) => order(a.role) - order(b.role));
}

/* ---------- leitura local ---------- */
function analyzeLocal(parts) {
  const text = parts.map(p => p.text).join('\n\n');
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const found = [];
  const nameNear = (line, idx) => {
    const before = line.slice(0, idx).replace(/(hex|rgb|cmyk|pantone|cor|color|código|#)[:\s]*$/i, '').trim();
    const w = before.split(/\s{2,}|[|•·:–-]/).pop().trim().split(/\s+/).slice(-3).join(' ');
    return /^[A-Za-zÀ-ú][\wÀ-ú ]{1,28}$/.test(w) && !/^(r|g|b|c|m|y|k|hex|rgb|cmyk)$/i.test(w) ? w : '';
  };
  lines.forEach((line, li) => {
    let m; const hexRe = /(?:#|hex[:\s]*#?)([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
    while ((m = hexRe.exec(line))) { let h = m[1]; if (h.length === 3) h = h.split('').map(x => x + x).join(''); found.push({ hex: '#' + h.toUpperCase(), name: nameNear(line, m.index) || nameNear(lines[li - 1] || '', 99) }); }
    const rgbRe = /\b(?:rgb|r)\s*[:(]?\s*(\d{1,3})\s*[,/ ]\s*(?:g\s*[:]?\s*)?(\d{1,3})\s*[,/ ]\s*(?:b\s*[:]?\s*)?(\d{1,3})/gi;
    while ((m = rgbRe.exec(line))) { if ([m[1], m[2], m[3]].every(v => +v <= 255)) found.push({ hex: toHex(+m[1], +m[2], +m[3]), name: nameNear(line, m.index) || nameNear(lines[li - 1] || '', 99) }); }
    const cmykRe = /\b(?:cmyk|c)\s*[:(]?\s*(\d{1,3})\s*%?\s*[,/ ]\s*(?:m\s*:?\s*)?(\d{1,3})\s*%?\s*[,/ ]\s*(?:y\s*:?\s*)?(\d{1,3})\s*%?\s*[,/ ]\s*(?:k\s*:?\s*)?(\d{1,3})/gi;
    while ((m = cmykRe.exec(line))) { const [c, mm, y, k] = [m[1], m[2], m[3], m[4]].map(v => Math.min(100, +v) / 100); found.push({ hex: toHex(255 * (1 - c) * (1 - k), 255 * (1 - mm) * (1 - k), 255 * (1 - y) * (1 - k)), name: nameNear(line, m.index) }); }
  });
  // junta códigos repetidos da mesma cor (HEX + RGB + CMYK)
  const pal = [];
  found.forEach(f => { const ex = pal.find(p => dist(p.hex, f.hex) < 18); if (ex) { if (!ex.name && f.name) ex.name = f.name; } else pal.push(f); });
  let source = 'códigos do manual';
  if (pal.length < 2) { // sem códigos escritos: usa as cores das páginas/imagens
    const cols = dedupe(parts.flatMap(p => p.colors)).filter(h => !(lum(h) > .97) || true).slice(0, 6);
    cols.forEach(h => { if (!pal.some(p => dist(p.hex, h) < 28)) pal.push({ hex: h, name: '' }); });
    source = 'cores das páginas';
  }
  const palette = assignRoles(pal.slice(0, 8)).map((p, i) => ({ hex: p.hex, name: p.name || `Cor ${i + 1}`, role: p.role }));

  // fontes
  const fonts = [];
  KNOWN_FONTS.forEach(fn => { const i = text.toLowerCase().indexOf(fn.toLowerCase()); if (i >= 0 && !fonts.some(x => x.n.toLowerCase().includes(fn.toLowerCase()) || fn.toLowerCase().includes(x.n.toLowerCase()))) fonts.push({ n: fn, i }); });
  const fre = /(?:fonte|tipografia|typeface|font|família)[^:\n]{0,30}[:–-]\s*([A-ZÀ-Ú][\w ]{2,30})/g; let m;
  while ((m = fre.exec(text))) { const n = m[1].trim().split(/\s{2,}/)[0]; if (!fonts.some(x => x.n.toLowerCase() === n.toLowerCase())) fonts.push({ n, i: m.index }); }
  fonts.sort((a, b) => a.i - b.i);
  const titleHint = fonts.find(f => /t[íi]tulo|headline|display|principal/i.test(text.slice(Math.max(0, f.i - 80), f.i)));
  const fontTitle = (titleHint || fonts[0])?.n || '';
  const fontText = fonts.find(f => f.n !== fontTitle)?.n || '';

  // seções de texto
  const HEAD = /\b(regras de uso|regras|tipografia|paleta|cores|logo(tipo)?|aplica[cç][oõ]es|elementos gr[aá]ficos|moodboard|fotografia|n[aã]o fa[cç]a|fa[cç]a)\b/i;
  const section = (re, max = 380) => { const i = text.search(re); if (i < 0) return ''; let after = text.slice(i).replace(re, '').replace(/^[\s:–-]+/, '').slice(0, max).split(/\n\s*\n/)[0]; const h = after.search(HEAD); if (h > 0) after = after.slice(0, h); return after.replace(/\s+/g, ' ').trim(); };
  const voice = section(/(tom de voz|voz da marca|personalidade da marca|como a marca fala|tone of voice)/i);
  const dosL = lines.filter(l => /([aá]rea de respiro|tamanho m[íi]nimo|use sempre|sempre use|^fa[cç]a|^✓|^✔)/i.test(l)).slice(0, 4);
  const dontsL = lines.filter(l => /(n[aã]o (use|aplique|distor|altere|mude|utilize|fa[cç]a)|nunca|evite|proibid|^✗|^✘|^×)/i.test(l)).slice(0, 4);
  const words = section(/(palavras que (usa|usamos)|vocabulário)/i, 160);
  const avoid = section(/(palavras (a evitar|que evitamos|proibidas))/i, 160);
  return { palette, fontTitle, fontText, voice, words, avoid, dos: dosL.join(' '), donts: dontsL.join(' '), notes: `Paleta a partir de ${source}.` };
}

/* ---------- leitura com IA (Claude) ---------- */
const BRAND_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['palette', 'fontTitle', 'fontText', 'voice', 'words', 'avoid', 'dos', 'donts', 'notes'],
  properties: {
    palette: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['hex', 'name', 'role'], properties: { hex: { type: 'string' }, name: { type: 'string' }, role: { type: 'string', enum: ROLES } } } },
    fontTitle: { type: 'string' }, fontText: { type: 'string' },
    voice: { type: 'string' }, words: { type: 'string' }, avoid: { type: 'string' },
    dos: { type: 'string' }, donts: { type: 'string' }, notes: { type: 'string' },
  },
};
async function analyzeWithClaude(files, parts, c, key) {
  const { default: Anthropic } = await import(ANTHROPIC_SDK);
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  const content = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i], p = parts[i];
    if (p.kind === 'pdf') content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: await fileToB64(f) } });
    else if (p.kind === 'image' && /image\/(png|jpeg|gif|webp)/.test(f.type)) content.push({ type: 'image', source: { type: 'base64', media_type: f.type, data: await fileToB64(f) } });
    else content.push({ type: 'text', text: `Arquivo “${f.name}”:\n${p.text}` });
  }
  content.push({ type: 'text', text: `Este material é o manual / brand kit da marca “${c.brand}”, cliente de um estúdio de design. Extraia a identidade visual para preencher o cadastro:
- palette: as cores oficiais da marca, na ordem de importância, com HEX exato em maiúsculas (#RRGGBB). Se o manual só der RGB, CMYK ou Pantone, converta para HEX. Se não houver códigos, deduza das imagens. Use o nome que o manual dá à cor (ou um nome curto e descritivo em português) e a função: primária, secundária, destaque, fundo ou texto. Máximo de 8 cores.
- fontTitle e fontText: nomes das famílias tipográficas de título e de texto ("" se não houver).
- voice: como a marca fala, em 1 ou 2 frases. words: palavras que usa. avoid: palavras ou temas que evita.
- dos e donts: regras de uso do logo e da marca (área de respiro, tamanho mínimo, fundos proibidos etc.), resumidas.
- notes: uma frase curta dizendo o que encontrou ou o que faltou no manual.
Escreva em português do Brasil. Deixe "" no que o material não informar — não invente.` });
  const res = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: BRAND_SCHEMA } },
    messages: [{ role: 'user', content }],
  });
  if (res.stop_reason === 'refusal') throw new Error('a IA recusou o pedido');
  const txt = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const out = JSON.parse(txt);
  out.palette = (out.palette || []).filter(p => /^#?[0-9a-f]{6}$/i.test(p.hex)).map(p => ({ ...p, hex: ('#' + p.hex.replace('#', '')).toUpperCase() }));
  return out;
}

/* ---------- aplicar + desfazer ---------- */
function applyBrand(cid, r, via, names) {
  const c = client(cid), idt = c.identity;
  UI.brandUndo = { cid, before: JSON.parse(JSON.stringify(idt)) };
  const changed = [];
  if (r.palette?.length) { idt.palette = r.palette; changed.push(`Paleta com ${r.palette.length} cores`); }
  [['fontTitle', 'Fonte de título'], ['fontText', 'Fonte de texto'], ['voice', 'Tom de voz'], ['words', 'Palavras que usa'], ['avoid', 'Palavras que evita'], ['dos', 'Regras: faça'], ['donts', 'Regras: não faça']]
    .forEach(([k, l]) => { if (r[k] && String(r[k]).trim()) { idt[k] = String(r[k]).trim(); changed.push(`${l}: ${idt[k].length > 60 ? idt[k].slice(0, 60) + '…' : idt[k]}`); } });
  if (r.logoImg) { idt.logoImg = r.logoImg; changed.push('Logo do cliente'); }
  idt.docs = [...new Set([...(idt.docs || []), ...names])];
  UI.neutral[cid] = false; UI.clientTab = 'identidade';
  save(); route();
  if (!changed.length) { toast('Li o arquivo, mas não encontrei cores, fontes nem regras para atualizar.', 'alert'); return; }
  openModal(`${modalHead('✨ Identidade atualizada')}<div class="modal-body">
    <p class="small muted" style="margin-top:0">Lido por ${esc(via)} a partir de ${names.map(n => '“' + esc(n) + '”').join(', ')}. A página de ${esc(c.brand)} já se vestiu com a nova identidade.</p>
    ${r.palette?.length ? `<div class="swatches" style="margin-bottom:12px">${r.palette.map(p => `<span title="${esc(p.name)} · ${p.role}" style="width:34px;height:34px;border-radius:10px;background:${p.hex}"></span>`).join('')}</div>` : ''}
    <div class="list small">${changed.map(t => `<div class="row">${icon('check').replace('<svg', '<svg style="width:15px;color:var(--ok)"')}<span class="grow">${esc(t)}</span></div>`).join('')}</div>
    ${r.notes ? `<p class="small muted" style="margin-bottom:0">${esc(r.notes)}</p>` : ''}</div>
    <div class="modal-foot"><button class="btn ghost" onclick="undoBrand()">${icon('refresh')} Desfazer</button><button class="btn primary" onclick="closeModal()">Ficou ótimo</button></div>`);
}
function undoBrand() {
  const u = UI.brandUndo; if (!u) return closeModal();
  client(u.cid).identity = u.before; UI.brandUndo = null; save(); closeModal(); route(); toast('Identidade anterior restaurada');
}
