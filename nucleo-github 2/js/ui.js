/* ==========================================================
   Núcleo — interface: menu, modais, avisos, busca
   ========================================================== */
const NAV = [
  { k: 'inicio', label: 'Início', ico: 'home', subs: [['dia', 'Visão do dia'], ['notas', 'Notas de prioridade'], ['datas', 'Datas do mês'], ['resumo', 'Resumo do mês'], ['alertas', 'Alertas']] },
  { k: 'clientes', label: 'Clientes', ico: 'users', subs: [['todos', 'Todos os clientes'], ['pastas', 'Pastas por nicho'], ['leads', 'Leads e orçamentos'], ['historico', 'Histórico (arquivados)']] },
  { k: 'servicos', label: 'Serviços', ico: 'layers', subs: [['catalogo', 'Catálogo de serviços'], ['pacotes', 'Pacotes e planos mensais'], ['processos', 'Processos de trabalho'], ['briefings', 'Briefings']] },
  { k: 'projetos', label: 'Projetos', ico: 'kanban', subs: [['quadro', 'Quadro (kanban)'], ['lista', 'Lista'], ['calendario', 'Calendário de entregas'], ['alteracoes', 'Alterações pendentes']] },
  { k: 'aprovacoes', label: 'Aprovações', ico: 'checkCircle', count: () => waitingApprovals().length, subs: [['aguardando', 'Aguardando cliente'], ['alteracoes', 'Com alterações'], ['aprovados', 'Aprovados'], ['links', 'Links compartilháveis']] },
  { k: 'contratos', label: 'Contratos', ico: 'file', subs: [['modelos', 'Modelos'], ['gerar', 'Gerar contrato'], ['enviados', 'Enviados e assinados'], ['mensagens', 'Mensagens prontas']] },
  { k: 'financeiro', label: 'Financeiro', ico: 'wallet', count: () => lateReceivables().length, subs: [['recebimentos', 'Recebimentos'], ['receber', 'A receber'], ['custos', 'Custos e despesas'], ['precificacao', 'Precificação'], ['metas', 'Metas']] },
  { k: 'relatorios', label: 'Relatórios', ico: 'chart', subs: [['resumo', 'Resumo mensal'], ['comparativo', 'Comparativo entre meses'], ['porcliente', 'Por cliente e por serviço'], ['exportar', 'Exportar PDF']] },
  { k: 'sun', label: 'SUNtendências', ico: 'sun', cls: 'sun', subs: [['radar', 'Radar de tendências'], ['plano', 'Plano do mês'], ['ideias', 'Banco de ideias'], ['desempenho', 'Desempenho'], ['regras', 'Regras da IA']] },
  { k: 'agenda', label: 'Agenda', ico: 'calendar', subs: [['prazos', 'Prazos'], ['reunioes', 'Reuniões'], ['posts', 'Calendário de posts'], ['datas', 'Datas comemorativas']] },
  { k: 'biblioteca', label: 'Biblioteca', ico: 'folder', subs: [['arquivos', 'Arquivos por cliente'], ['brandkits', 'Brand kits'], ['referencias', 'Referências'], ['templates', 'Templates']] },
  { k: 'config', label: 'Configurações', ico: 'settings', subs: [['estudio', 'Dados do estúdio'], ['identidade', 'Identidade do sistema'], ['pagamentos', 'Pagamentos'], ['acessos', 'Acessos'], ['backup', 'Backup']] },
];
const UI = { open: new Set(['inicio']) };

function renderNav(sec, sub) {
  if (sec && sec !== UI.navSec) { UI.open = new Set([sec]); UI.navSec = sec; }
  document.getElementById('nav').innerHTML = NAV.map(n => {
    const c = n.count ? n.count() : 0;
    const open = UI.open.has(n.k);
    return `<div class="nav-group ${open ? 'open' : ''}">
      <button class="nav-item ${n.cls || ''} ${sec === n.k ? 'active' : ''}" onclick="navClick('${n.k}')" title="${n.label}">
        ${icon(n.ico, 'ico')}<span class="label">${n.label}</span>${c ? `<span class="count">${c}</span>` : ''}${icon('chev', 'chev')}
      </button>
      <div class="subnav"><div>${n.subs.map(([k, l]) => `<a href="#/${n.k}/${k}" class="${sec === n.k && sub === k ? 'active' : ''}">${l}</a>`).join('')}</div></div>
    </div>`;
  }).join('');
  const bb = [['inicio', 'Início', 'home'], ['clientes', 'Clientes', 'users'], ['projetos', 'Projetos', 'kanban'], ['aprovacoes', 'Aprovações', 'checkCircle'], ['financeiro', 'Financeiro', 'wallet']];
  const wc = waitingApprovals().length;
  document.getElementById('bottom-bar').innerHTML = bb.map(([k, l, i]) => `<a href="#/${k}" class="${sec === k ? 'on' : ''}">${icon(i)}${l}${k === 'aprovacoes' && wc ? `<span class="count">${wc}</span>` : ''}</a>`).join('') +
    `<button onclick="document.body.classList.toggle('more-open')">${icon('menu')}Mais</button>`;
}
function navClick(k) {
  const cur = HASH.v.split('/')[1];
  if (cur === k && UI.open.has(k)) { UI.open.delete(k); renderNav(k, HASH.v.split('/')[2]); return; }
  UI.open.add(k); HASH.v = '#/' + k;
}

/* ---------- toast ---------- */
function toast(msg, ico = 'check') {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = icon(ico) + `<span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = 0; setTimeout(() => el.remove(), 300); }, 2600);
}
async function copyText(t, msg = 'Copiado! É só colar no WhatsApp.') {
  try { await navigator.clipboard.writeText(t); } catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (_) { } ta.remove();
  }
  toast(msg, 'copy');
}

/* ---------- modal ---------- */
function openModal(html, { wide = false, onClose } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="overlay" onmousedown="if(event.target===this)closeModal()"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  UI.onClose = onClose;
  setTimeout(() => root.querySelector('input,select,textarea')?.focus(), 30);
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; UI.onClose && UI.onClose(); UI.onClose = null; }
const modalHead = t => `<div class="modal-head"><h2>${t}</h2><button class="btn ghost sm" onclick="closeModal()" aria-label="Fechar">${icon('x')}</button></div>`;

/* formulário genérico */
function openForm({ title, fields, submit = 'Salvar', onSubmit, wide, extra = '' }) {
  UI.formSubmit = onSubmit;
  const f = fields.map(x => {
    const v = x.value ?? '';
    let input;
    if (x.type === 'select') input = `<select name="${x.k}" ${x.multiple ? 'multiple size="4"' : ''}>${x.options.map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; const sel = x.multiple ? (v || []).includes(ov) : String(v) === String(ov); return `<option value="${esc(ov)}" ${sel ? 'selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`;
    else if (x.type === 'textarea') input = `<textarea name="${x.k}" placeholder="${esc(x.ph || '')}">${esc(v)}</textarea>`;
    else if (x.type === 'checkbox') input = `<label style="display:flex;gap:8px;align-items:center;font-weight:500;color:var(--text)"><input type="checkbox" name="${x.k}" ${v ? 'checked' : ''} style="width:auto"> ${esc(x.cb || '')}</label>`;
    else if (x.type === 'colors') input = `<div class="color-pick">${x.options.map(([cv, hex]) => `<input type="radio" name="${x.k}" id="cp_${cv}" value="${cv}" ${v === cv ? 'checked' : ''}><label for="cp_${cv}" style="background:${hex}" title="${cv}"></label>`).join('')}</div>`;
    else input = `<input name="${x.k}" type="${x.type || 'text'}" value="${esc(v)}" placeholder="${esc(x.ph || '')}" ${x.step ? `step="${x.step}"` : ''} ${x.required ? 'required' : ''}>`;
    return `<div class="f ${x.full ? 'full' : ''}"><label>${x.label}</label>${input}</div>`;
  }).join('');
  openModal(`${modalHead(title)}<form onsubmit="submitForm(event)"><div class="modal-body"><div class="form">${f}</div>${extra}</div>
    <div class="modal-foot"><button type="button" class="btn ghost" onclick="closeModal()">Cancelar</button><button class="btn primary" type="submit">${submit}</button></div></form>`, { wide });
}
function submitForm(e) {
  e.preventDefault();
  const fd = new FormData(e.target); const out = {};
  for (const el of e.target.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.multiple) out[el.name] = [...el.selectedOptions].map(o => o.value);
    else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
    else if (el.type === 'number') out[el.name] = el.value === '' ? '' : Number(el.value);
    else out[el.name] = fd.get(el.name);
  }
  const fn = UI.formSubmit; closeModal(); fn && fn(out); save(); route();
}
function confirmBox(msg, onYes, yes = 'Confirmar') {
  UI.confirmYes = onYes;
  openModal(`${modalHead('Tem certeza?')}<div class="modal-body"><p style="margin:0">${msg}</p></div><div class="modal-foot"><button class="btn ghost" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="const f=UI.confirmYes;closeModal();f();save();route()">${yes}</button></div>`);
}

/* ---------- confete ---------- */
function confetti() {
  const colors = ['#FF5C90', '#FFD1DE', '#FDF4BE', '#F6DC72', '#3C3C3C'];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement('div'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's'; c.style.animationDelay = Math.random() * .4 + 's';
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}

/* ---------- busca global ---------- */
function searchAll(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const r = [];
  DB.clients.forEach(c => { if ((c.brand + ' ' + c.name + ' ' + c.instagram).toLowerCase().includes(q)) r.push({ k: 'Cliente', t: c.brand, s: c.name, href: `#/clientes/c/${c.id}`, logo: clientLogo(c.id, 28) }); });
  DB.projects.forEach(p => { if ((p.title + ' ' + clientName(p.clientId)).toLowerCase().includes(q)) r.push({ k: 'Projeto', t: p.title, s: clientName(p.clientId), href: `#/projetos/p/${p.id}`, logo: icon('kanban') }); });
  DB.contracts.forEach(k => { const t = `Contrato · ${service(k.serviceId)?.name}`; if ((t + ' ' + clientName(k.clientId)).toLowerCase().includes(q)) r.push({ k: 'Contrato', t, s: clientName(k.clientId), href: `#/contratos/k/${k.id}`, logo: icon('file') }); });
  DB.leads.forEach(l => { if ((l.brand + ' ' + l.name).toLowerCase().includes(q)) r.push({ k: 'Lead', t: l.brand, s: l.stage, href: `#/clientes/leads`, logo: icon('users') }); });
  return r.slice(0, 10);
}
function setupSearch() {
  const inp = document.getElementById('search'), box = document.getElementById('search-results');
  let sel = 0, res = [];
  const draw = () => {
    if (!inp.value.trim()) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = res.length ? res.map((x, i) => `<a href="${x.href}" class="${i === sel ? 'sel' : ''}" onmousedown="HASH.v='${x.href}'">${x.logo}<div><div style="font-weight:600">${esc(x.t)}</div><div class="small muted">${esc(x.s)}</div></div><span class="kind">${x.k}</span></a>`).join('')
      : `<div class="small muted" style="padding:12px">Nada encontrado para “${esc(inp.value)}”.</div>`;
  };
  inp.addEventListener('input', () => { sel = 0; res = searchAll(inp.value); draw(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, res.length - 1); draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    if (e.key === 'Enter' && res[sel]) { HASH.v = res[sel].href; inp.value = ''; draw(); inp.blur(); }
    if (e.key === 'Escape') { inp.value = ''; draw(); inp.blur(); }
  });
  inp.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 150));
  inp.addEventListener('focus', draw);
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); inp.focus(); } if (e.key === 'Escape') closeModal(); });
}

/* ---------- + Novo ---------- */
function setupNew() {
  const btn = document.getElementById('btn-new'), m = document.getElementById('menu-new');
  btn.innerHTML = icon('plus') + '<span class="btn-new-label">Novo</span>';
  m.innerHTML = [['users', 'Cliente', 'formClient()'], ['kanban', 'Projeto', 'formProject()'], ['file', 'Contrato', "HASH.v='#/contratos/gerar'"], ['money', 'Recebimento', 'formPayment()'], ['star', 'Nota de prioridade', 'formNote()'], ['calendar', 'Data importante', 'formDate()']]
    .map(([i, l, fn]) => `<button onclick="document.getElementById('menu-new').classList.add('hidden');${fn}">${icon(i)}${l}</button>`).join('');
  btn.onclick = e => { e.stopPropagation(); m.classList.toggle('hidden'); };
  document.addEventListener('click', () => m.classList.add('hidden'));
}

/* ---------- helpers de layout ---------- */
const pageHead = (title, desc, actions = '', crumbs = '') => `<div class="page-head"><div>${crumbs ? `<div class="crumbs">${crumbs}</div>` : ''}<h1>${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div><div class="actions">${actions}</div></div>`;
const subTabs = (sec, subs, cur) => `<div class="tabs no-print">${subs.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" onclick="HASH.v='#/${sec}/${k}'">${l}</button>`).join('')}</div>`;
const empty = (t, ico = 'sparkle', cta = '') => `<div class="empty"><div class="e-ico">${icon(ico)}</div><div>${t}</div>${cta ? `<div style="margin-top:14px">${cta}</div>` : ''}</div>`;
const checkBtn = (on, fn) => `<button class="check ${on ? 'on' : ''}" onclick="event.stopPropagation();${fn}" aria-pressed="${on}">${icon('check')}</button>`;
const opts = (arr, key = 'id', lab = 'name') => arr.map(x => [x[key], x[lab]]);
const clientOpts = () => DB.clients.filter(c => c.status !== 'Encerrado').map(c => [c.id, c.brand]);
const serviceOpts = () => DB.services.map(s => [s.id, s.name]);
const waLink = (num, text = '') => `https://wa.me/${String(num).replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
function fillVars(text, vars) { return text.replace(/\{([^}]+)\}/g, (m, k) => vars[k] ?? m); }
