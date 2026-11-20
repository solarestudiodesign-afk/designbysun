/* ==========================================================
   Núcleo — dados, utilidades e ícones
   Tudo fica salvo no navegador (localStorage). "Cada informação
   é cadastrada uma vez e aparece onde for preciso."
   ========================================================== */
/* navegação interna (funciona igual no navegador e dentro do link publicado) */
const HASH = {
  _v: (() => { try { return sessionStorage.getItem('nucleo.path') || ''; } catch (e) { return ''; } })(),
  get v() { return this._v; },
  set v(x) { this._v = x; try { sessionStorage.setItem('nucleo.path', x); } catch (e) { } if (typeof route === 'function') route(); },
};
const STORE_KEY = 'nucleo.studiosun.v1';

/* ---------- utilidades ---------- */
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const rel = n => iso(addDays(TODAY, n));
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const daysFromToday = s => daysBetween(iso(TODAY), s);
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MONTHS_S = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const WEEK = ['dom','seg','ter','qua','qui','sex','sáb'];
const fmtDate = s => { if (!s) return '—'; const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
const fmtDateLong = s => { if (!s) return '—'; const d = parse(s); return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`; };
const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const brl2 = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = s => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const ym = s => s.slice(0, 7);
const curYM = iso(TODAY).slice(0, 7);
const prevYM = (k, n = 1) => { const [y, m] = k.split('-').map(Number); const d = new Date(y, m - 1 - n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const ymLabel = k => { const [y, m] = k.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
const countdown = n => n === 0 ? 'é hoje' : n === 1 ? 'amanhã' : n > 0 ? `faltam ${n} dias` : n === -1 ? 'ontem' : `há ${-n} dias`;

/* contraste automático: texto escuro sobre cor clara e vice-versa */
function isLight(hex) {
  const h = hex.replace('#', ''); const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
const inkOn = hex => isLight(hex) ? '#2C2C2C' : '#FFFFFF';
function hexToRgb(hex) { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function rgbToCmyk([r, g, b]) {
  const k = 1 - Math.max(r, g, b) / 255; if (k === 1) return [0, 0, 0, 100];
  return [r, g, b].map(v => Math.round(((1 - v / 255 - k) / (1 - k)) * 100)).concat(Math.round(k * 100));
}
function mix(hex, withHex, amt) {
  const a = hexToRgb(hex), b = hexToRgb(withHex);
  return '#' + a.map((v, i) => Math.round(v * (1 - amt) + b[i] * amt).toString(16).padStart(2, '0')).join('');
}

/* ---------- datas sazonais (calculadas todo ano) ---------- */
function nthWeekday(year, month, weekday, n) { // month 0-based
  const d = new Date(year, month, 1); let c = 0;
  while (true) { if (d.getDay() === weekday && ++c === n) return iso(d); d.setDate(d.getDate() + 1); }
}
function lastFridayNov(year) { const d = new Date(year, 10, 30); while (d.getDay() !== 5) d.setDate(d.getDate() - 1); return iso(d); }
function seasonalDates(year) {
  const y = year;
  return [
    { day: `${y}-01-01`, name: 'Ano Novo', type: 'Feriado' },
    { day: `${y}-01-31`, name: 'Janeiro Branco', type: 'Sazonal', month: true },
    { day: `${y}-03-08`, name: 'Dia da Mulher', type: 'Sazonal' },
    { day: `${y}-03-15`, name: 'Dia do Consumidor', type: 'Comércio' },
    { day: `${y}-04-21`, name: 'Tiradentes', type: 'Feriado' },
    { day: `${y}-05-01`, name: 'Dia do Trabalho', type: 'Feriado' },
    { day: nthWeekday(y, 4, 0, 2), name: 'Dia das Mães', type: 'Comércio' },
    { day: `${y}-06-12`, name: 'Dia dos Namorados', type: 'Comércio' },
    { day: nthWeekday(y, 7, 0, 2), name: 'Dia dos Pais', type: 'Comércio' },
    { day: `${y}-09-07`, name: 'Independência do Brasil', type: 'Feriado' },
    { day: `${y}-09-15`, name: 'Dia do Cliente', type: 'Comércio' },
    { day: `${y}-10-01`, name: 'Outubro Rosa', type: 'Sazonal', month: true },
    { day: `${y}-10-12`, name: 'Dia das Crianças', type: 'Comércio' },
    { day: `${y}-10-31`, name: 'Halloween', type: 'Sazonal' },
    { day: `${y}-11-01`, name: 'Novembro Azul', type: 'Sazonal', month: true },
    { day: `${y}-11-02`, name: 'Finados', type: 'Feriado' },
    { day: `${y}-11-15`, name: 'Proclamação da República', type: 'Feriado' },
    { day: `${y}-11-20`, name: 'Dia da Consciência Negra', type: 'Feriado' },
    { day: lastFridayNov(y), name: 'Black Friday', type: 'Comércio' },
    { day: `${y}-12-25`, name: 'Natal', type: 'Feriado' },
    { day: `${y}-12-31`, name: 'Réveillon', type: 'Sazonal' },
  ].map(d => ({ ...d, id: 'saz_' + d.day + d.name.replace(/\W/g, ''), seasonal: true, notice: 15 }));
}

/* ---------- ícones (traço 2px) ---------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.7c2 .7 3.3 2.5 3.6 5.3"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 7v7M12 7v10M16 7v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/><path d="M6 6V5a2 2 0 0 1 2-2h9"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sunSmall: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
  pin: '<path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  board: '<rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/><rect x="17" y="3" width="4" height="8" rx="1.5"/>',
  whats: '<path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  trend: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
  trendDown: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 2 1.5 3 2.5 3-1-3 0-6 .5-8.5z"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="7.5" r="1.3"/><circle cx="16" cy="10" r="1.3"/><path d="M12 21a2 2 0 0 1 0-4h1.5a2.5 2.5 0 0 0 0-5"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  message: '<path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6.2A8 8 0 1 1 21 12z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  drag: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
const SUN_SVG = `<svg class="sun" viewBox="0 0 100 100" aria-hidden="true"><g fill="#fff" opacity=".95">${Array.from({ length: 12 }, (_, i) => `<rect x="47" y="2" width="6" height="18" rx="3" transform="rotate(${i * 30} 50 50)"/>`).join('')}</g><circle cx="50" cy="50" r="24" fill="#fff"/><circle cx="50" cy="50" r="17" fill="#FDF4BE"/></svg>`;

/* ---------- dados de exemplo ---------- */
function seed() {
  const niches = [
    { id: 'n_lash', name: 'Lash e sobrancelhas' }, { id: 'n_nail', name: 'Nail' }, { id: 'n_tattoo', name: 'Tattoo' },
    { id: 'n_inst', name: 'Institucional' }, { id: 'n_igreja', name: 'Igrejas' }, { id: 'n_rest', name: 'Restaurantes' }, { id: 'n_edu', name: 'Educação' },
  ];
  const id = (name, pal, fonts) => ({
    palette: pal, fontTitle: fonts[0], fontText: fonts[1],
    voice: 'Próxima, acolhedora e confiante. Fala com "você", usa frases curtas.',
    words: 'cuidado, autoestima, detalhe, delicadeza', avoid: 'barato, promoção relâmpago, gírias pesadas',
    dos: 'Respeitar área de respiro igual à altura do “S”. Usar sobre fundos claros.', donts: 'Não distorcer, não aplicar sobre fotos muito carregadas, não trocar as cores.',
    logos: ['Principal', 'Reduzida', 'Ícone', 'Negativa', 'Monocromática'],
  });
  const clients = [
    { id: 'c_sena', name: 'Sena Oliveira', brand: 'Sena Art Nails', niches: ['n_nail'], whatsapp: '5511987654321', instagram: '@senaartnails', email: 'contato@senaart.com', doc: '12.345.678/0001-90', city: 'São Paulo · SP', origin: 'Indicação', status: 'Ativo', value: 890, valueType: 'mensal', service: 's_social', last: rel(-1), since: rel(-210),
      identity: id('Sena', [{ hex: '#7A2E4F', name: 'Vinho Sena', role: 'primária' }, { hex: '#E8B4C8', name: 'Rosé', role: 'secundária' }, { hex: '#D4A24C', name: 'Dourado', role: 'destaque' }, { hex: '#FBF3F5', name: 'Pétala', role: 'fundo' }, { hex: '#2B1A22', name: 'Ameixa', role: 'texto' }], ['Playfair Display', 'Inter']),
      notes: [{ d: rel(-12), t: 'Prefere posts com fundo claro e foto da mão em close. Não gosta de emoji em excesso.' }, { d: rel(-40), t: 'Reunião de alinhamento: foco em atrair clientes para alongamento em gel.' }] },
    { id: 'c_lume', name: 'Larissa Mendes', brand: 'Lume Lash Studio', niches: ['n_lash'], whatsapp: '5511912345678', instagram: '@lumelash', email: 'larissa@lume.com', doc: '987.654.321-00', city: 'Campinas · SP', origin: 'Instagram', status: 'Ativo', value: 230, valueType: 'projeto', service: 's_logo', last: rel(-3), since: rel(-20),
      identity: id('Lume', [{ hex: '#1F3A3D', name: 'Petróleo', role: 'primária' }, { hex: '#C9A27E', name: 'Areia', role: 'secundária' }, { hex: '#F2C14E', name: 'Luz', role: 'destaque' }, { hex: '#F7F3EE', name: 'Linho', role: 'fundo' }, { hex: '#1A1A1A', name: 'Grafite', role: 'texto' }], ['Cormorant Garamond', 'DM Sans']),
      notes: [{ d: rel(-18), t: 'Quer uma marca minimalista, que transmita leveza.' }] },
    { id: 'c_ink', name: 'Rafael Costa', brand: 'Ink House Tattoo', niches: ['n_tattoo'], whatsapp: '5521998765432', instagram: '@inkhouse', email: 'rafa@inkhouse.com', doc: '22.111.333/0001-44', city: 'Rio de Janeiro · RJ', origin: 'Indicação', status: 'Ativo', value: 220, valueType: 'projeto', service: 's_catalogo', last: rel(-5), since: rel(-35),
      identity: id('Ink', [{ hex: '#0F0F0F', name: 'Nanquim', role: 'primária' }, { hex: '#B33A3A', name: 'Sangue', role: 'secundária' }, { hex: '#E9E4D8', name: 'Papel', role: 'fundo' }, { hex: '#C8B88A', name: 'Ouro velho', role: 'destaque' }], ['Bebas Neue', 'Inter']), notes: [] },
    { id: 'c_bistro', name: 'Marina Duarte', brand: 'Bistrô Alecrim', niches: ['n_rest'], whatsapp: '5511955554444', instagram: '@bistroalecrim', email: 'marina@alecrim.com', doc: '33.222.111/0001-55', city: 'São Paulo · SP', origin: 'Google', status: 'Ativo', value: 650, valueType: 'mensal', service: 's_social', last: rel(-2), since: rel(-120),
      identity: id('Alecrim', [{ hex: '#3E5C3A', name: 'Alecrim', role: 'primária' }, { hex: '#E07A3F', name: 'Páprica', role: 'destaque' }, { hex: '#F4EDE1', name: 'Massa', role: 'fundo' }, { hex: '#A7B89A', name: 'Sálvia', role: 'secundária' }, { hex: '#262626', name: 'Carvão', role: 'texto' }], ['Fraunces', 'Inter']), notes: [] },
    { id: 'c_igreja', name: 'Pr. Daniel Rocha', brand: 'Igreja Videira Centro', niches: ['n_igreja', 'n_inst'], whatsapp: '5511944443333', instagram: '@videiracentro', email: 'midia@videira.org', doc: '44.555.666/0001-77', city: 'Guarulhos · SP', origin: 'Indicação', status: 'Pausado', value: 480, valueType: 'mensal', service: 's_posts', last: rel(-26), since: rel(-300),
      identity: id('Videira', [{ hex: '#4B2E83', name: 'Uva', role: 'primária' }, { hex: '#F5B700', name: 'Luz', role: 'destaque' }, { hex: '#F6F4FA', name: 'Névoa', role: 'fundo' }], ['Montserrat', 'Inter']), notes: [] },
    { id: 'c_edu', name: 'Atlética Medicina Unifesp', brand: 'A.A.A. Medicina', niches: ['n_edu'], whatsapp: '5511933332222', instagram: '@aaamed', email: 'diretoria@aaamed.com', doc: '55.666.777/0001-88', city: 'São Paulo · SP', origin: 'Instagram', status: 'Encerrado', value: 1200, valueType: 'projeto', service: 's_identidade', last: rel(-95), since: rel(-260),
      identity: id('AAA', [{ hex: '#0B3D91', name: 'Azul atlética', role: 'primária' }, { hex: '#FFFFFF', name: 'Branco', role: 'fundo' }, { hex: '#FFC20E', name: 'Ouro', role: 'destaque' }], ['Anton', 'Inter']), notes: [] },
  ];
  const services = [
    { id: 's_identidade', name: 'Identidade visual completa', desc: 'Marca do zero com manual e aplicações.', includes: 'Logo + variações, paleta, tipografia, manual da marca, 3 aplicações', deadline: 'a definir', price: 0, payment: '50% de entrada + 50% na entrega', changes: 3, hours: 30, process: ['Briefing', 'Pesquisa', 'Rascunhos', 'Apresentação', 'Ajustes', 'Entrega de arquivos'] },
    { id: 's_logo', name: 'Logotipo + paleta de cores', desc: 'Logo principal e paleta para começar com o pé direito.', includes: 'Logo principal, versão reduzida, paleta com códigos', deadline: '7 a 12 dias', price: 230, payment: '50% de entrada', changes: 2, hours: 8, process: ['Briefing', 'Pesquisa', 'Rascunhos', 'Apresentação', 'Ajustes', 'Entrega de arquivos'] },
    { id: 's_catalogo', name: 'Catálogo', desc: 'Catálogo digital de produtos ou serviços.', includes: 'Até 12 páginas, PDF para WhatsApp', deadline: '7 a 15 dias', price: 220, payment: '50% de entrada', changes: 2, hours: 9, process: ['Briefing', 'Conteúdo', 'Diagramação', 'Apresentação', 'Ajustes', 'Entrega'] },
    { id: 's_social', name: 'Social media mensal', desc: 'Planejamento + criação de posts todo mês.', includes: '12 posts + 4 stories por mês, legendas', deadline: 'mensal', price: 0, payment: 'Mensalidade até dia 10', changes: 2, hours: 20, process: ['Planejamento', 'Criação', 'Aprovação', 'Ajustes', 'Agendamento'], monthly: true },
    { id: 's_posts', name: 'Posts avulsos / carrossel', desc: 'Peças pontuais para campanhas.', includes: 'Arte + legenda', deadline: 'a definir', price: 0, payment: '100% antecipado', changes: 1, hours: 2, process: ['Briefing', 'Criação', 'Aprovação', 'Entrega'] },
    { id: 's_site', name: 'Site ou cardápio digital', desc: 'Página simples e bonita no ar.', includes: 'Layout + publicação', deadline: 'a definir', price: 0, payment: '50% de entrada', changes: 2, hours: 16, process: ['Briefing', 'Wireframe', 'Layout', 'Desenvolvimento', 'Publicação'] },
    { id: 's_video', name: 'Edição de vídeo / motion', desc: 'Reels, vinhetas e animações.', includes: 'Edição, legendas, trilha', deadline: 'a definir', price: 0, payment: '50% de entrada', changes: 2, hours: 6, process: ['Roteiro', 'Edição', 'Aprovação', 'Ajustes', 'Entrega'] },
    { id: 's_impresso', name: 'Cartão de visitas e impressos', desc: 'Peças para impressão com arquivo pronto para gráfica.', includes: 'Frente e verso + arquivo fechado', deadline: 'a definir', price: 0, payment: '100% antecipado', changes: 2, hours: 3, process: ['Briefing', 'Criação', 'Aprovação', 'Fechamento de arquivo'] },
  ];
  const packages = [
    { id: 'pk1', name: 'Plano Essencial', items: '8 posts + 4 stories / mês', price: 490, monthly: true },
    { id: 'pk2', name: 'Plano Brilho', items: '12 posts + 4 stories + 1 Reels / mês', price: 890, monthly: true },
    { id: 'pk3', name: 'Kit Abertura', items: 'Logotipo + paleta + 6 posts de lançamento', price: 520, monthly: false },
  ];
  const mkChecklist = (sid, doneN) => (services.find(s => s.id === sid)?.process || []).map((t, i) => ({ t, done: i < doneN }));
  const projects = [
    { id: 'p1', clientId: 'c_lume', serviceId: 's_logo', title: 'Logo Lume Lash', stage: 'Em aprovação', due: rel(2), value: 230, changesUsed: 1, changesIncluded: 2, checklist: mkChecklist('s_logo', 4), changes: [{ t: 'Deixar o “L” mais fino', done: true }], hours: 6.5, versions: ['V1', 'V2'], history: [{ d: rel(-18), t: 'Projeto criado' }, { d: rel(-6), t: 'V1 enviada para aprovação' }, { d: rel(-2), t: 'V2 enviada para aprovação' }] },
    { id: 'p2', clientId: 'c_ink', serviceId: 's_catalogo', title: 'Catálogo de flashes 2026', stage: 'Em criação', due: rel(5), value: 220, changesUsed: 0, changesIncluded: 2, checklist: mkChecklist('s_catalogo', 2), changes: [], hours: 4, versions: [], history: [{ d: rel(-9), t: 'Projeto criado' }] },
    { id: 'p3', clientId: 'c_sena', serviceId: 's_social', title: 'Social Sena · novembro', stage: 'Ajustes', due: rel(0), value: 890, changesUsed: 3, changesIncluded: 2, checklist: mkChecklist('s_social', 3), changes: [{ t: 'Trocar foto do post 4', done: false }, { t: 'Legenda do carrossel mais curta', done: false }, { t: 'Cor do fundo no post 7', done: true }], hours: 14, versions: ['V1', 'V2'], history: [{ d: rel(-12), t: 'Projeto criado' }] },
    { id: 'p4', clientId: 'c_bistro', serviceId: 's_social', title: 'Social Alecrim · novembro', stage: 'Em criação', due: rel(4), value: 650, changesUsed: 0, changesIncluded: 2, checklist: mkChecklist('s_social', 1), changes: [], hours: 7, versions: [], history: [{ d: rel(-8), t: 'Projeto criado' }] },
    { id: 'p5', clientId: 'c_bistro', serviceId: 's_site', title: 'Cardápio digital Alecrim', stage: 'Briefing', due: rel(14), value: 600, changesUsed: 0, changesIncluded: 2, checklist: mkChecklist('s_site', 0), changes: [], hours: 0, versions: [], history: [{ d: rel(-1), t: 'Projeto criado' }] },
    { id: 'p6', clientId: 'c_sena', serviceId: 's_posts', title: 'Campanha Black Friday Sena', stage: 'Briefing', due: rel(-1), value: 180, changesUsed: 0, changesIncluded: 1, checklist: mkChecklist('s_posts', 0), changes: [], hours: 0, versions: [], history: [{ d: rel(-4), t: 'Projeto criado' }] },
    { id: 'p7', clientId: 'c_edu', serviceId: 's_identidade', title: 'Identidade A.A.A. Medicina', stage: 'Entregue', due: rel(-95), value: 1200, changesUsed: 2, changesIncluded: 3, checklist: mkChecklist('s_identidade', 6), changes: [], hours: 28, versions: ['V1', 'V2', 'Final'], history: [{ d: rel(-95), t: 'Entregue' }] },
    { id: 'p8', clientId: 'c_ink', serviceId: 's_impresso', title: 'Cartão de visitas Ink House', stage: 'Finalizado', due: rel(1), value: 150, changesUsed: 1, changesIncluded: 2, checklist: mkChecklist('s_impresso', 4), changes: [], hours: 2.5, versions: ['V1', 'Final'], history: [{ d: rel(-3), t: 'Aprovado pelo cliente' }] },
  ];
  const ART = [['#7A2E4F', '#FBF3F5'], ['#1F3A3D', '#F2C14E'], ['#3E5C3A', '#F4EDE1'], ['#0F0F0F', '#E9E4D8']];
  const approvals = [
    { id: 'a1', projectId: 'p1', clientId: 'c_lume', title: 'Logo Lume — V2', kind: 'imagem', sentAt: rel(-2), status: 'aguardando', version: 'V2', caption: 'Versão com o “L” mais fino e o brilho no ponto do i.', art: { bg: '#1F3A3D', fg: '#F2C14E', text: 'lume\nlash studio' }, comments: [], active: true },
    { id: 'a2', projectId: 'p3', clientId: 'c_sena', title: 'Carrossel “5 cuidados com o gel”', kind: 'carrossel', sentAt: rel(-5), status: 'alteracao', version: 'V1', caption: 'Salva esse post pra não esquecer! 💅 Os 5 cuidados que fazem seu alongamento durar muito mais.', art: { bg: '#7A2E4F', fg: '#FBF3F5', text: '5 cuidados\ncom o gel', slides: 5 }, comments: [{ t: 'Legenda do carrossel mais curta', x: 50, y: 70 }], active: true, respondedAt: rel(-3) },
    { id: 'a3', projectId: 'p4', clientId: 'c_bistro', title: 'Post prato da semana', kind: 'imagem', sentAt: rel(-4), status: 'aguardando', version: 'V1', caption: 'Risoto de cogumelos com alecrim fresco. Só essa semana!', art: { bg: '#3E5C3A', fg: '#F4EDE1', text: 'prato da\nsemana' }, comments: [], active: true },
    { id: 'a4', projectId: 'p8', clientId: 'c_ink', title: 'Cartão de visitas — final', kind: 'imagem', sentAt: rel(-4), status: 'aprovado', version: 'V2', caption: '', art: { bg: '#0F0F0F', fg: '#E9E4D8', text: 'INK\nHOUSE' }, comments: [], active: true, respondedAt: rel(-3) + ' 14:22' },
    { id: 'a5', projectId: 'p3', clientId: 'c_sena', title: 'Reels “antes e depois”', kind: 'video', sentAt: rel(-1), status: 'aguardando', version: 'V1', caption: 'Do natural ao uau ✨', art: { bg: '#E8B4C8', fg: '#7A2E4F', text: 'antes\n& depois' }, comments: [], active: true },
  ];
  const contracts = [
    { id: 'k1', clientId: 'c_lume', serviceId: 's_logo', value: 230, status: 'Aceito', created: rel(-19), acceptedAt: rel(-18) + ' 10:41', deadline: '10 dias', payment: '50% de entrada' },
    { id: 'k2', clientId: 'c_ink', serviceId: 's_catalogo', value: 220, status: 'Aceito', created: rel(-10), acceptedAt: rel(-9) + ' 19:02', deadline: '12 dias', payment: '50% de entrada' },
    { id: 'k3', clientId: 'c_bistro', serviceId: 's_site', value: 600, status: 'Enviado', created: rel(-6), deadline: '20 dias', payment: '50% de entrada' },
    { id: 'k4', clientId: 'c_sena', serviceId: 's_posts', value: 180, status: 'Rascunho', created: rel(-1), deadline: '5 dias', payment: '100% antecipado' },
  ];
  const contractModel = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESIGN

CONTRATANTE: {cliente}, inscrito(a) sob CPF/CNPJ {CPF/CNPJ}.
CONTRATADA: {estudio}, inscrita sob CNPJ/MEI {cnpj_estudio}.

1. OBJETO
A CONTRATADA prestará à CONTRATANTE o serviço de {serviço}, incluindo: {inclui}.

2. PRAZO
O prazo de entrega é de {prazo}, contados a partir do recebimento do briefing completo e do pagamento da entrada.

3. VALOR E PAGAMENTO
Pelo serviço, a CONTRATANTE pagará {valor}, na seguinte forma: {forma de pagamento}. Chave Pix: {pix}.
Atrasos estão sujeitos a multa de {multa}% sobre o valor em aberto.

4. ALTERAÇÕES
Estão inclusas {alterações inclusas} rodadas de alteração. Alterações adicionais serão orçadas à parte.

5. DIREITOS
Após a quitação, a CONTRATANTE recebe os arquivos finais e o direito de uso da arte. A CONTRATADA pode exibir o trabalho em seu portfólio.

6. CANCELAMENTO
Em caso de desistência após o início, a entrada não será devolvida, por cobrir as horas já trabalhadas.

{cidade}, {data}.`;
  const messages = [
    { id: 'm1', name: 'Boas-vindas e próximos passos', text: 'Oi, {nome}! Que alegria ter você aqui no Studio Sun ☀️\nPróximos passos: 1) te mando o contrato, 2) você responde o briefing, 3) a gente começa a criar! Qualquer dúvida, é só chamar.' },
    { id: 'm2', name: 'Envio de orçamento', text: 'Oi, {nome}! Segue o orçamento de {serviço}: {valor}, prazo de {prazo}. Pagamento: {forma}. Posso reservar sua vaga na agenda?' },
    { id: 'm3', name: 'Envio de briefing', text: '{nome}, aqui está o briefing para começarmos: {link}\nResponde com calma, quanto mais detalhes, mais certeiro fica o resultado ✨' },
    { id: 'm4', name: 'Lembrete de aprovação', text: 'Oi, {nome}! Passando pra lembrar que a arte está te esperando aqui: {link}. É só clicar em aprovar ou pedir alteração 💗' },
    { id: 'm5', name: 'Cobrança gentil', text: 'Oi, {nome}, tudo bem? Lembrete carinhoso: a parcela de {valor} vence em {data}. Chave Pix: {pix}. Obrigada!' },
    { id: 'm6', name: 'Cobrança de atraso', text: 'Oi, {nome}. A parcela de {valor} venceu em {data} e ainda não identifiquei o pagamento. Consegue verificar? Chave Pix: {pix}.' },
    { id: 'm7', name: 'Entrega final com os arquivos', text: '{nome}, chegou o grande dia! 🎉 Seus arquivos finais estão aqui: {link}. Foi um prazer criar com você!' },
    { id: 'm8', name: 'Pedido de depoimento', text: '{nome}, você toparia deixar um depoimento sobre a experiência com o Studio Sun? Ajuda demais o meu trabalho 💗' },
    { id: 'm9', name: 'Proposta de renovação do plano mensal', text: 'Oi, {nome}! Seu plano mensal renova em {data}. Quer seguir com o mesmo formato ou ajustamos algo para o próximo mês?' },
  ];
  // recebimentos dos últimos 6 meses
  const payments = [];
  const monthsBack = [5, 4, 3, 2, 1, 0];
  const base = [3100, 3650, 2900, 4200, 4750, 0];
  monthsBack.forEach((mb, i) => {
    const k = prevYM(curYM, mb); if (mb === 0) return;
    payments.push({ id: uid('pg'), clientId: 'c_sena', projectId: null, value: 890, date: `${k}-08`, method: 'Pix', type: 'mensalidade' });
    payments.push({ id: uid('pg'), clientId: 'c_bistro', projectId: null, value: 650, date: `${k}-10`, method: 'Pix', type: 'mensalidade' });
    payments.push({ id: uid('pg'), clientId: mb > 3 ? 'c_edu' : 'c_igreja', projectId: null, value: base[i] - 1540, date: `${k}-18`, method: mb % 2 ? 'Transferência' : 'Cartão', type: mb > 3 ? 'parcela' : 'mensalidade' });
  });
  payments.push({ id: uid('pg'), clientId: 'c_sena', value: 890, date: rel(-1 - (TODAY.getDate() > 8 ? 0 : 0)), method: 'Pix', type: 'mensalidade' });
  payments.push({ id: uid('pg'), clientId: 'c_lume', projectId: 'p1', value: 115, date: rel(-18), method: 'Pix', type: 'entrada' });
  payments.push({ id: uid('pg'), clientId: 'c_ink', projectId: 'p2', value: 110, date: rel(-9), method: 'Pix', type: 'entrada' });
  payments.push({ id: uid('pg'), clientId: 'c_ink', projectId: 'p8', value: 150, date: rel(-3), method: 'Cartão', type: 'quitação' });
  const receivables = [
    { id: 'r1', clientId: 'c_lume', projectId: 'p1', desc: 'Logo Lume — quitação', value: 115, due: rel(3), paid: false },
    { id: 'r2', clientId: 'c_ink', projectId: 'p2', desc: 'Catálogo — quitação', value: 110, due: rel(6), paid: false },
    { id: 'r3', clientId: 'c_bistro', projectId: null, desc: 'Mensalidade novembro', value: 650, due: rel(-2), paid: false },
    { id: 'r4', clientId: 'c_igreja', projectId: null, desc: 'Mensalidade outubro', value: 480, due: rel(-12), paid: false },
    { id: 'r5', clientId: 'c_bistro', projectId: 'p5', desc: 'Cardápio — entrada', value: 300, due: rel(12), paid: false },
    { id: 'r6', clientId: 'c_sena', projectId: null, desc: 'Mensalidade dezembro', value: 890, due: rel(30), paid: false },
  ];
  const costs = [
    { id: 'co1', name: 'Adobe Creative Cloud', value: 124, kind: 'fixo' }, { id: 'co2', name: 'Canva Pro', value: 35, kind: 'fixo' },
    { id: 'co3', name: 'Banco de imagens', value: 49, kind: 'fixo' }, { id: 'co4', name: 'Internet', value: 110, kind: 'fixo' },
    { id: 'co5', name: 'Hospedagem', value: 30, kind: 'fixo' }, { id: 'co6', name: 'Celular', value: 60, kind: 'fixo' },
    { id: 'co7', name: 'MEI / impostos', value: 76, kind: 'fixo' },
    { id: 'co8', name: 'Fonte comprada (Ink House)', value: 45, kind: 'variavel', projectId: 'p2', date: rel(-7) },
    { id: 'co9', name: 'Impressão prova cartão', value: 22, kind: 'variavel', projectId: 'p8', date: rel(-4) },
  ];
  const notes = [
    { id: 'no1', title: 'Fechar a campanha de Black Friday da Sena', text: 'Ela quer 3 posts + 2 stories. Briefing atrasado!', color: 'pink', pinned: true, focus: true, due: rel(1), link: { type: 'projeto', id: 'p6' }, checklist: [{ t: 'Cobrar briefing', done: true }, { t: 'Rascunho do post 1', done: false }], done: false },
    { id: 'no2', title: 'Responder lead do Bistrô sobre cardápio', text: 'Contrato enviado, falta o aceite.', color: 'yellow', pinned: true, due: rel(0), link: { type: 'cliente', id: 'c_bistro' }, checklist: [], done: false },
    { id: 'no3', title: 'Gravar Reels de Affinity', text: 'Tutorial: degradê em texto em 30s.', color: 'black', pinned: false, checklist: [], done: false },
    { id: 'no4', title: 'Atualizar portfólio', text: 'Subir identidade da Atlética.', color: 'white', pinned: false, checklist: [], done: false },
  ];
  const myDates = [
    { id: 'd1', name: 'Aniversário de 2 anos — Sena Art Nails', day: rel(10), type: 'Cliente', clientId: 'c_sena', repeat: true, notice: 15 },
    { id: 'd2', name: 'Inauguração do Bistrô (nova unidade)', day: rel(21), type: 'Evento', clientId: 'c_bistro', repeat: false, notice: 15 },
  ];
  const tasks = [
    { id: 't1', title: 'Ajustes do post 4 da Sena', date: rel(0), done: false, projectId: 'p3' },
    { id: 't2', title: 'Mandar V2 do catálogo para revisão interna', date: rel(0), done: false, projectId: 'p2' },
    { id: 't3', title: 'Responder Larissa sobre o logo', date: rel(0), done: true, clientId: 'c_lume' },
    { id: 't4', title: 'Agendar posts do Alecrim', date: rel(0), done: false, clientId: 'c_bistro' },
  ];
  const meetings = [
    { id: 'mt1', clientId: 'c_bistro', title: 'Briefing do cardápio digital', date: rel(1), time: '15:00', link: 'https://meet.google.com/', notes: '' },
    { id: 'mt2', clientId: 'c_sena', title: 'Planejamento de dezembro', date: rel(6), time: '10:30', link: 'https://meet.google.com/', notes: '' },
  ];
  const posts = [
    { id: 'po1', clientId: 'c_sena', title: 'Carrossel 5 cuidados', date: rel(1), status: 'em aprovação', format: 'carrossel' },
    { id: 'po2', clientId: 'c_sena', title: 'Reels antes e depois', date: rel(3), status: 'em aprovação', format: 'reels' },
    { id: 'po3', clientId: 'c_bistro', title: 'Prato da semana', date: rel(2), status: 'em aprovação', format: 'estatico' },
    { id: 'po4', clientId: 'c_bistro', title: 'Bastidores da cozinha', date: rel(-2), status: 'publicado', format: 'reels' },
  ];
  const leads = [
    { id: 'l1', name: 'Juliana Prado', brand: 'Ju Brows', contact: '5511977776666', serviceId: 's_logo', value: 230, stage: 'Primeiro contato', date: rel(-1), niche: 'n_lash' },
    { id: 'l2', name: 'Atlética Direito PUC', brand: 'A.A.A. Direito', contact: '5511966665555', serviceId: 's_identidade', value: 1400, stage: 'Orçamento enviado', date: rel(-4), niche: 'n_edu' },
    { id: 'l3', name: 'Paulo Henrique', brand: 'Barbearia Navalha', contact: '5511955556666', serviceId: 's_social', value: 650, stage: 'Negociando', date: rel(-6), niche: 'n_inst' },
    { id: 'l4', name: 'Café Grão', brand: 'Café Grão', contact: '5511944445555', serviceId: 's_catalogo', value: 220, stage: 'Perdido', date: rel(-20), niche: 'n_rest' },
  ];
  const sun = {
    trends: [
      { id: 'tr1', title: 'Texto com efeito “recorte de papel”', why: 'Formato tátil em alta no Pinterest e TikTok; muito salvo como referência.', temp: 'subindo', use: 'Reels de 30s ensinando no Affinity com a ferramenta de contorno.', fmt: 'reels' },
      { id: 'tr2', title: 'Carrossel “antes e depois” de rebrand', why: 'Rebrands de marcas reais estão gerando debate; posts de análise viralizam.', temp: 'no pico', use: 'Analisar um rebrand recente e mostrar o que você faria diferente.', fmt: 'carrossel' },
      { id: 'tr3', title: 'Recurso novo do Canva: Magic Layers', why: 'Lançamento recente, poucas pessoas sabem usar ainda.', temp: 'subindo', use: 'Tutorial rápido + “3 usos que ninguém te contou”.', fmt: 'reels' },
      { id: 'tr4', title: 'Interclasses e jogos universitários', why: 'Calendário universitário: atléticas buscando uniformes e artes de jogos.', temp: 'no pico', use: 'Post mostrando processo de identidade de atlética → atrai cliente.', fmt: 'carrossel' },
      { id: 'tr5', title: 'Estética Y2K cromada', why: 'Ainda aparece, mas perdeu força nas últimas semanas.', temp: 'caindo', use: 'Usar só se ligada a um tutorial prático.', fmt: 'estatico' },
    ],
    plan: [], ideas: [
      { id: 'i1', title: 'Paletas de Natal que fogem do vermelho e verde', fmt: 'carrossel' },
      { id: 'i2', title: 'Mockup 3D de camiseta de atlética no Affinity', fmt: 'reels' },
    ],
    rules: {
      tone: 'Despojado mas profissional, direto, sem enrolação, sempre com CTA.',
      goals: 'Ensinar design, Affinity e Canva; gerar conteúdo salvável; atrair clientes.',
      formats: 'Reels (foco principal) · Carrossel · Estático',
      freq: 15, avoid: 'Polêmicas, conteúdo genérico de “dicas de design” sem prática, trends de dança.',
      themes: 'design, universidades, atléticas, marcas reais, Affinity, Canva',
    },
    chat: [{ from: 'ai', t: 'Oi, Emilly! Sou a SUNtendências ☀️ Posso gerar o plano do mês, trocar posts ou buscar ideias para um nicho. O que vamos criar?' }],
  };
  return {
    studio: { name: 'Studio Sun', owner: 'Emilly', cnpj: '00.000.000/0001-00', pix: 'contato@studiosun.com', whatsapp: '5511900000000', email: 'contato@studiosun.com', city: 'São Paulo', entrada: 50, multa: 2, methods: ['Pix', 'Cartão', 'Transferência'] },
    niches, clients, services, packages, projects, approvals, contracts, contractModel, messages, payments, receivables, costs,
    goals: { month: 6000, year: 50000, newClients: 3 },
    pricing: { desired: 4500, hoursMonth: 110, margin: 20, tax: 6 },
    notes, notesDone: [], myDates, hiddenSeasonal: [], tasks, meetings, posts, leads, sun,
    library: {
      refs: [{ id: 'rf1', name: 'Minimalista rosé', niche: 'n_nail' }, { id: 'rf2', name: 'Bistrô rústico', niche: 'n_rest' }, { id: 'rf3', name: 'Atléticas bold', niche: 'n_edu' }],
      templates: [{ id: 'tp1', name: 'Carrossel educativo 7 páginas', kind: 'carrossel' }, { id: 'tp2', name: 'Apresentação de entrega de marca', kind: 'apresentação' }, { id: 'tp3', name: 'Mockup feed Instagram', kind: 'mockup' }],
    },
    access: [{ id: 'ac1', name: 'Bia (freelancer motion)', email: 'bia@email.com', perms: 'Vê projetos · não vê financeiro' }],
    briefings: { s_logo: ['Nome da marca', 'O que a marca faz?', 'Público-alvo', '3 palavras que descrevem a marca', 'Cores que você gosta / não gosta', 'Referências'], s_social: ['Objetivo do perfil', 'Público', 'Produtos/serviços em destaque', 'Tom de voz', 'Datas importantes'] },
    timer: null,
    celebrated: null,
  };
}

/* ---------- store ---------- */
let DB;
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); DB = raw ? JSON.parse(raw) : seed(); }
  catch (e) { DB = seed(); }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) { /* armazenamento indisponível */ } }
function resetData() { DB = seed(); save(); }
load();

/* ---------- consultas ---------- */
const client = id => DB.clients.find(c => c.id === id);
const service = id => DB.services.find(s => s.id === id);
const project = id => DB.projects.find(p => p.id === id);
const clientName = id => client(id)?.brand || '—';
const clientColor = id => client(id)?.identity?.palette?.[0]?.hex || '#FFD1DE';
function clientLogo(id, size = 40) {
  const c = client(id); const bg = clientColor(id);
  if (c?.identity?.logoImg) return `<div class="client-logo" style="background:#fff;border:1px solid var(--line);width:${size}px;height:${size}px;padding:${Math.round(size * .12)}px"><img src="${c.identity.logoImg}" alt="" style="width:100%;height:100%;object-fit:contain"></div>`;
  return `<div class="client-logo" style="background:${bg};color:${inkOn(bg)};width:${size}px;height:${size}px;font-size:${Math.round(size * .38)}px">${initials(c?.brand || '?')}</div>`;
}
const STATUS_PILL = { 'Lead': 'yellow', 'Ativo': 'ok', 'Pausado': '', 'Encerrado': 'dark', 'Rascunho': '', 'Enviado': 'yellow', 'Aceito': 'ok', 'Vencido': 'danger' };
const pill = (txt, cls) => `<span class="pill ${cls ?? STATUS_PILL[txt] ?? ''}">${esc(txt)}</span>`;
const STAGES = ['Briefing', 'Em criação', 'Em aprovação', 'Ajustes', 'Finalizado', 'Entregue'];
const STAGE_COLOR = { 'Briefing': '#B9B4AD', 'Em criação': '#FF5C90', 'Em aprovação': '#F6DC72', 'Ajustes': '#E5484D', 'Finalizado': '#3DBE7A', 'Entregue': '#3C3C3C' };
const LEAD_STAGES = ['Primeiro contato', 'Orçamento enviado', 'Negociando', 'Fechado', 'Perdido'];

function allDates(year = TODAY.getFullYear()) {
  const saz = [...seasonalDates(year), ...seasonalDates(year + 1)].filter(d => !DB.hiddenSeasonal.includes(d.name));
  const mine = DB.myDates.map(d => {
    if (!d.repeat) return d;
    const md = d.day.slice(5); let day = `${year}-${md}`; if (daysFromToday(day) < -1) day = `${year + 1}-${md}`;
    return { ...d, day };
  });
  return [...saz, ...mine].sort((a, b) => a.day.localeCompare(b.day));
}
const paidIn = k => DB.payments.filter(p => ym(p.date) === k).reduce((s, p) => s + Number(p.value), 0);
const costsIn = k => DB.costs.filter(c => c.kind === 'fixo').reduce((s, c) => s + Number(c.value), 0) + DB.costs.filter(c => c.kind === 'variavel' && c.date && ym(c.date) === k).reduce((s, c) => s + Number(c.value), 0);
const openReceivables = () => DB.receivables.filter(r => !r.paid);
const lateReceivables = () => openReceivables().filter(r => daysFromToday(r.due) < 0);
const activeProjects = () => DB.projects.filter(p => !['Entregue'].includes(p.stage));
const waitingApprovals = () => DB.approvals.filter(a => a.status === 'aguardando' && a.active);
const projectCost = pid => DB.costs.filter(c => c.projectId === pid).reduce((s, c) => s + Number(c.value), 0);
function hourRate() {
  const fixed = DB.costs.filter(c => c.kind === 'fixo').reduce((s, c) => s + Number(c.value), 0);
  return (Number(DB.pricing.desired) + fixed) / Math.max(1, Number(DB.pricing.hoursMonth));
}
function suggestedPrice(s) {
  const base = s.hours * hourRate();
  return Math.round(base * (1 + DB.pricing.margin / 100) * (1 + DB.pricing.tax / 100));
}
function alerts() {
  const out = [];
  DB.contracts.filter(k => k.status === 'Enviado').forEach(k => out.push({ lvl: 'yellow', ico: 'file', t: `Contrato de ${clientName(k.clientId)} enviado e não assinado`, s: `enviado ${countdown(daysFromToday(k.created))}`, href: '#/contratos/enviados' }));
  lateReceivables().forEach(r => out.push({ lvl: 'danger', ico: 'money', t: `Pagamento vencido: ${clientName(r.clientId)} · ${brl(r.value)}`, s: `venceu ${countdown(daysFromToday(r.due))}`, href: '#/financeiro/receber' }));
  DB.approvals.filter(a => a.status === 'aguardando' && a.active && -daysFromToday(a.sentAt) >= 3).forEach(a => out.push({ lvl: 'yellow', ico: 'clock', t: `${clientName(a.clientId)} sem resposta há ${-daysFromToday(a.sentAt)} dias`, s: a.title, href: '#/aprovacoes/aguardando' }));
  DB.projects.filter(p => p.changesUsed > p.changesIncluded && p.stage !== 'Entregue').forEach(p => out.push({ lvl: 'danger', ico: 'alert', t: `${p.title} estourou as alterações`, s: `${p.changesUsed} de ${p.changesIncluded} inclusas`, href: `#/projetos/p/${p.id}` }));
  DB.projects.filter(p => daysFromToday(p.due) < 0 && !['Finalizado', 'Entregue'].includes(p.stage)).forEach(p => out.push({ lvl: 'danger', ico: 'clock', t: `${p.title} está atrasado`, s: `prazo era ${fmtDate(p.due)}`, href: `#/projetos/p/${p.id}` }));
  allDates().filter(d => { const n = daysFromToday(d.day); return n >= 0 && n <= (d.notice || 15) && !d.month && (d.type !== 'Feriado'); }).slice(0, 3).forEach(d => out.push({ lvl: 'yellow', ico: 'calendar', t: `${d.name} ${countdown(daysFromToday(d.day))}`, s: 'hora de preparar a arte', href: '#/agenda/datas' }));
  return out;
}
