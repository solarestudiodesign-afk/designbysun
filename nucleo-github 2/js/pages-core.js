/* ==========================================================
   Fase 1 — Início, Clientes, Serviços, Projetos
   ========================================================== */
const PAGES = {};

/* ============ 1. INÍCIO ============ */
PAGES.inicio = (sub) => {
  const k = curYM, prev = prevYM(curYM);
  const fat = paidIn(k), fatPrev = paidIn(prev);
  const delta = fatPrev ? Math.round((fat - fatPrev) / fatPrev * 100) : 0;
  const rec = openReceivables(), late = lateReceivables();
  const recTotal = rec.reduce((s, r) => s + r.value, 0), lateTotal = late.reduce((s, r) => s + r.value, 0);
  const goal = DB.goals.month, pct = Math.min(100, Math.round(fat / goal * 100));
  if (pct >= 100 && DB.celebrated !== k) { DB.celebrated = k; save(); setTimeout(confetti, 400); }
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const kpis = `<div class="grid g4 kpis" id="resumo">
    <div class="card kpi accent hover"><div class="ico-bg">${icon('money')}</div><div class="label">Faturado no mês</div><div class="value num">${brl(fat)}</div><div class="delta">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs. ${MONTHS[parse(prev + '-01').getMonth()]}</div></div>
    <a class="card kpi hover" href="#/financeiro/receber" style="color:inherit"><div class="ico-bg">${icon('wallet')}</div><div class="label">A receber</div><div class="value num">${brl(recTotal)}</div><div class="delta ${lateTotal ? 'down' : 'up'}">${lateTotal ? `${brl(lateTotal)} atrasado` : 'nada atrasado'}</div></a>
    <a class="card kpi hover" href="#/projetos/quadro" style="color:inherit"><div class="ico-bg">${icon('kanban')}</div><div class="label">Projetos ativos</div><div class="value num">${activeProjects().length}</div><div class="delta muted">${DB.projects.filter(p => daysFromToday(p.due) >= 0 && daysFromToday(p.due) <= 7 && p.stage !== 'Entregue').length} vencem esta semana</div></a>
    <a class="card kpi hover" href="#/aprovacoes/aguardando" style="color:inherit"><div class="ico-bg" style="background:var(--yellow);color:var(--yellow-ink)">${icon('checkCircle')}</div><div class="label">Aguardando aprovação</div><div class="value num">${waitingApprovals().length}</div><div class="delta muted">${DB.approvals.filter(a => a.status === 'alteracao').length} com alterações</div></a>
  </div>`;

  // notas
  const notes = [...DB.notes].sort((a, b) => (b.pinned - a.pinned));
  const notesHtml = `<div class="card" id="notas" style="margin-top:18px"><div class="card-head"><h2>${icon('pin')} Notas de prioridade</h2><div class="actions"><a class="btn ghost sm" onclick="showNotesHistory()">Histórico (${DB.notesDone.length})</a><button class="btn primary sm" onclick="formNote()">${icon('plus')} Nota</button></div></div>
    <div class="notes" id="notes-wall">${notes.map(noteCard).join('')}<button class="note-add" onclick="formNote()">${icon('plus')} Nova nota</button></div></div>`;

  // datas do mês
  const ds = allDates().filter(d => { const n = daysFromToday(d.day); return (ym(d.day) === k) || (n >= 0 && n <= 30); });
  const datesHtml = `<div class="card" id="datas" style="margin-top:18px"><div class="card-head"><h2>${icon('calendar')} Datas importantes · ${MONTHS[TODAY.getMonth()]}</h2><div class="actions"><a class="btn ghost sm" href="#/agenda/datas">Ver todas</a><button class="btn sm" onclick="formDate()">${icon('plus')} Data</button></div></div>
    <div class="dates">${ds.map(dateChip).join('') || '<span class="muted">Nenhuma data neste mês.</span>'}</div></div>`;

  // hoje
  const today = DB.tasks.filter(t => t.date === iso(TODAY) || (!t.done && daysFromToday(t.date) < 0));
  const dueToday = DB.projects.filter(p => p.due === iso(TODAY) && !['Finalizado', 'Entregue'].includes(p.stage));
  const hoje = `<div class="card" id="dia"><div class="card-head"><h2>Hoje</h2><button class="btn ghost sm" onclick="formTask()">${icon('plus')} Tarefa</button></div><div class="list">
    ${dueToday.map(p => `<div class="row clickable" onclick="HASH.v='#/projetos/p/${p.id}'">${clientLogo(p.clientId, 26)}<div class="grow"><div class="title">${esc(p.title)}</div><div class="sub">prazo de entrega hoje</div></div>${pill('Prazo hoje', 'danger')}</div>`).join('')}
    ${today.map(t => `<div class="row ${t.done ? 'done' : ''}">${checkBtn(t.done, `toggleTask('${t.id}')`)}<div class="grow"><div class="title">${esc(t.title)}</div>${daysFromToday(t.date) < 0 ? `<div class="sub" style="color:var(--danger)">atrasada · ${fmtDate(t.date)}</div>` : ''}</div><button class="btn ghost sm" onclick="delTask('${t.id}')" aria-label="Remover">${icon('x')}</button></div>`).join('') || (dueToday.length ? '' : empty('Dia livre por aqui ☀️', 'sun'))}
  </div></div>`;

  // próximas entregas
  const next = DB.projects.filter(p => { const n = daysFromToday(p.due); return n >= 0 && n <= 7 && !['Entregue'].includes(p.stage); }).sort((a, b) => a.due.localeCompare(b.due));
  const entregas = `<div class="card"><div class="card-head"><h2>Próximas entregas</h2><a class="btn ghost sm" href="#/projetos/calendario">Calendário</a></div><div class="list">
    ${next.map(p => `<div class="row clickable" onclick="HASH.v='#/projetos/p/${p.id}'"><div style="text-align:center;min-width:44px"><div style="font-family:var(--f-title);font-weight:700;font-size:18px">${parse(p.due).getDate()}</div><div class="small muted">${WEEK[parse(p.due).getDay()]}</div></div><div class="grow"><div class="title">${esc(p.title)}</div><div class="sub">${esc(clientName(p.clientId))}</div></div>${pill(p.stage, stagePill(p.stage))}</div>`).join('') || empty('Nada vence nos próximos 7 dias.')}
  </div></div>`;

  // alertas
  const al = alerts();
  const alertas = `<div class="card" id="alertas"><div class="card-head"><h2>${icon('alert')} Alertas</h2><span class="pill yellow nodot">${al.length}</span></div><div class="list">
    ${al.slice(0, 7).map(a => `<a class="row clickable" href="${a.href}" style="color:inherit"><span class="pill ${a.lvl} nodot" style="padding:6px">${icon(a.ico)}</span><div class="grow"><div class="title" style="white-space:normal">${esc(a.t)}</div><div class="sub">${esc(a.s)}</div></div></a>`).join('') || empty('Tudo em dia!', 'checkCircle')}
  </div></div>`.replace(/<span class="pill (\w+) nodot" style="padding:6px"><svg/g, '<span class="pill $1 nodot" style="padding:6px"><svg style="width:15px;height:15px"');

  // meta
  const meta = `<div class="card"><div class="card-head"><h2>${icon('target')} Meta do mês</h2><a class="btn ghost sm" href="#/financeiro/metas">Ajustar</a></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><span style="font-family:var(--f-title);font-size:30px;font-weight:700">${pct}%</span><span class="muted">${brl(fat)} de ${brl(goal)}</span></div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <p class="small muted" style="margin:10px 0 0">${pct >= 100 ? '🎉 Meta batida! Que mês!' : `Faltam <b style="color:var(--text)">${brl(goal - fat)}</b> para a meta.`}</p></div>`;

  // gráfico
  const months = [5, 4, 3, 2, 1, 0].map(n => prevYM(curYM, n)); const vals = months.map(paidIn); const max = Math.max(...vals, 1);
  const chart = `<div class="card"><div class="card-head"><h2>Faturamento · 6 meses</h2><a class="btn ghost sm" href="#/relatorios/comparativo">Relatórios</a></div>
    <div class="bars">${months.map((m, i) => `<div class="bar ${m === curYM ? 'cur' : ''}" title="${ymLabel(m)}: ${brl(vals[i])}"><span class="v">${vals[i] >= 1000 ? (vals[i] / 1000).toFixed(1).replace('.', ',') + 'k' : vals[i]}</span><div class="b" style="height:${Math.max(4, vals[i] / max * 130)}px"></div><span class="m">${MONTHS_S[parse(m + '-01').getMonth()]}</span></div>`).join('')}</div></div>`;

  // clientes ativos
  const act = DB.clients.filter(c => c.status === 'Ativo');
  const ativos = `<div class="card"><div class="card-head"><h2>Clientes ativos do mês</h2><a class="btn ghost sm" href="#/clientes/todos">Todos</a></div><div class="avatars">
    ${act.map(c => `<div class="a" onclick="HASH.v='#/clientes/c/${c.id}'">${clientLogo(c.id, 34)}<div><div style="font-weight:600;font-size:13px">${esc(c.brand)}</div><div class="small muted">${esc(service(c.service)?.name || '')}</div></div></div>`).join('')}
  </div></div>`;

  const atalhos = `<div class="card soft"><div class="card-head"><h2>Atalhos rápidos</h2></div><div class="actions">
    <button class="btn" onclick="formClient()">${icon('users')} Novo cliente</button>
    <a class="btn" href="#/contratos/gerar">${icon('file')} Gerar contrato</a>
    <button class="btn" onclick="formPayment()">${icon('money')} Registrar pagamento</button>
    <button class="btn primary" onclick="formApproval()">${icon('send')} Enviar para aprovação</button></div></div>`;

  return `${pageHead(`${hello}, ${esc(DB.studio.owner)} ☀️`, `${WEEK[TODAY.getDay()]}, ${fmtDateLong(iso(TODAY))} · aqui está o que precisa de atenção hoje.`)}
    ${kpis}${notesHtml}${datesHtml}
    <div class="grid g3" style="margin-top:18px">${hoje}${entregas}${alertas}</div>
    <div class="grid g3" style="margin-top:18px">${meta}<div class="span2">${chart}</div></div>
    <div class="grid g2" style="margin-top:18px">${ativos}${atalhos}</div>`;
};
PAGES.inicio.after = (sub) => {
  if (sub && sub !== 'dia') document.getElementById(sub)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  enableNoteDrag();
};

function noteCard(n) {
  const link = n.link ? (n.link.type === 'cliente' ? { t: clientName(n.link.id), h: `#/clientes/c/${n.link.id}` } : { t: project(n.link.id)?.title, h: `#/projetos/p/${n.link.id}` }) : null;
  return `<div class="note ${n.color}" draggable="true" data-id="${n.id}">
    ${n.focus ? '<span class="focus">★ Foco do dia</span>' : ''}
    <div class="tools"><button title="${n.pinned ? 'Desafixar' : 'Fixar no topo'}" onclick="toggleNote('${n.id}','pinned')" style="${n.pinned ? 'opacity:1' : ''}">${icon('pin')}</button><button title="Foco do dia" onclick="setFocus('${n.id}')">${icon('star')}</button><button title="Editar" onclick="formNote('${n.id}')">${icon('edit')}</button><button title="Concluir" onclick="doneNote('${n.id}')">${icon('check')}</button></div>
    <h3>${esc(n.title)}</h3>${n.text ? `<p>${esc(n.text)}</p>` : ''}
    ${n.checklist?.length ? `<div class="cl">${n.checklist.map((c, i) => `<label><input type="checkbox" ${c.done ? 'checked' : ''} onchange="toggleNoteItem('${n.id}',${i})"> <span style="${c.done ? 'text-decoration:line-through;opacity:.7' : ''}">${esc(c.t)}</span></label>`).join('')}</div>` : ''}
    <div class="meta">${n.due ? `<span>⏰ ${countdown(daysFromToday(n.due))}</span>` : ''}${link ? `<a href="${link.h}" style="color:inherit;text-decoration:underline">↗ ${esc(link.t)}</a>` : ''}</div>
  </div>`;
}
function enableNoteDrag() {
  const wall = document.getElementById('notes-wall'); if (!wall) return;
  let dragId = null;
  wall.querySelectorAll('.note').forEach(el => {
    el.addEventListener('dragstart', () => { dragId = el.dataset.id; el.classList.add('dragging'); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', e => {
      e.preventDefault(); const to = el.dataset.id; if (!dragId || dragId === to) return;
      const arr = DB.notes; const from = arr.findIndex(n => n.id === dragId); const item = arr.splice(from, 1)[0];
      const idx = arr.findIndex(n => n.id === to); item.pinned = arr[idx].pinned; arr.splice(idx, 0, item); save(); route();
    });
  });
}
function toggleNote(id, f) { const n = DB.notes.find(x => x.id === id); n[f] = !n[f]; save(); route(); }
function setFocus(id) { DB.notes.forEach(n => n.focus = n.id === id ? !n.focus : false); const n = DB.notes.find(x => x.id === id); if (n.focus) n.pinned = true; save(); route(); }
function toggleNoteItem(id, i) { const n = DB.notes.find(x => x.id === id); n.checklist[i].done = !n.checklist[i].done; save(); route(); }
function doneNote(id) { const i = DB.notes.findIndex(x => x.id === id); const n = DB.notes.splice(i, 1)[0]; n.doneAt = iso(TODAY); DB.notesDone.unshift(n); save(); route(); toast('Nota concluída e movida para o histórico'); }
function showNotesHistory() {
  openModal(`${modalHead('Histórico de notas')}<div class="modal-body"><div class="list">${DB.notesDone.map(n => `<div class="row"><div class="grow"><div class="title">${esc(n.title)}</div><div class="sub">concluída em ${fmtDate(n.doneAt)}</div></div><button class="btn sm" onclick="restoreNote('${n.id}')">${icon('refresh')} Voltar ao mural</button></div>`).join('') || empty('Nenhuma nota concluída ainda.')}</div></div>`);
}
function restoreNote(id) { const i = DB.notesDone.findIndex(x => x.id === id); const n = DB.notesDone.splice(i, 1)[0]; DB.notes.push(n); save(); closeModal(); route(); }
function formNote(id) {
  const n = id ? DB.notes.find(x => x.id === id) : { color: 'pink', checklist: [] };
  const linkOpts = [['', 'Sem vínculo'], ...DB.clients.map(c => ['cliente:' + c.id, 'Cliente · ' + c.brand]), ...DB.projects.map(p => ['projeto:' + p.id, 'Projeto · ' + p.title])];
  openForm({
    title: id ? 'Editar nota' : 'Nova nota de prioridade', fields: [
      { k: 'title', label: 'Título', value: n.title, full: true, required: true },
      { k: 'text', label: 'Texto curto', type: 'textarea', value: n.text, full: true },
      { k: 'checklist', label: 'Checklist (um item por linha, opcional)', type: 'textarea', value: (n.checklist || []).map(c => c.t).join('\n'), full: true },
      { k: 'color', label: 'Cor do cartão', type: 'colors', value: n.color, options: [['pink', '#FF5C90'], ['lightpink', '#FFD1DE'], ['yellow', '#FDF4BE'], ['white', '#FFFFFF'], ['black', '#3C3C3C']] },
      { k: 'due', label: 'Prazo', type: 'date', value: n.due },
      { k: 'link', label: 'Vincular a', type: 'select', options: linkOpts, value: n.link ? `${n.link.type}:${n.link.id}` : '', full: true },
      { k: 'pinned', label: 'Destaque', type: 'checkbox', cb: 'Fixar no topo', value: n.pinned },
    ], onSubmit: v => {
      const old = n.checklist || [];
      const obj = { ...n, title: v.title, text: v.text, color: v.color || 'pink', due: v.due || null, pinned: v.pinned,
        link: v.link ? { type: v.link.split(':')[0], id: v.link.split(':')[1] } : null,
        checklist: v.checklist.split('\n').map(s => s.trim()).filter(Boolean).map(t => ({ t, done: old.find(o => o.t === t)?.done || false })) };
      if (id) Object.assign(n, obj); else DB.notes.unshift({ ...obj, id: uid('no') });
      toast(id ? 'Nota atualizada' : 'Nota criada');
    }
  });
}
function dateChip(d) {
  const n = daysFromToday(d.day); const soon = n >= 0 && n <= 7;
  return `<div class="date-chip ${soon ? 'soon' : ''} ${n < 0 && !d.month ? 'past' : ''}">
    <span class="d">${d.month ? MONTHS_S[parse(d.day).getMonth()] : fmtDate(d.day)}</span><span class="n">${esc(d.name)}</span>
    <span class="c">${d.month ? 'o mês todo' : countdown(n)} · ${d.type}${d.clientId ? ' · ' + esc(clientName(d.clientId)) : ''}</span>
    ${d.seasonal || d.type === 'Evento' || d.type === 'Cliente' ? `<button class="btn sm" onclick="createContentFor('${esc(d.name)}','${d.clientId || ''}')">${icon('sparkle')} Criar conteúdo</button>` : ''}
  </div>`;
}
function createContentFor(name, cid) {
  openModal(`${modalHead('Criar conteúdo para ' + esc(name))}<div class="modal-body"><p class="muted" style="margin-top:0">Para onde mandar essa data?</p><div class="grid g2">
    <button class="card hover" style="border:0;text-align:left" onclick="closeModal();DB.sun.ideas.unshift({id:uid('i'),title:'Post para ${esc(name).replace(/'/g, '')}',fmt:'carrossel'});save();HASH.v='#/sun/ideias';toast('Enviado ao Banco de ideias da SUNtendências')"><h3>${icon('sun')} SUNtendências</h3><p class="small muted">Vira ideia para o seu Instagram.</p></button>
    <button class="card hover" style="border:0;text-align:left" onclick="closeModal();formProject({title:'${esc(name).replace(/'/g, '')}',clientId:'${cid}'})"><h3>${icon('kanban')} Projeto de cliente</h3><p class="small muted">Abre um projeto com prazo.</p></button>
  </div></div>`);
}
function formDate(id) {
  const d = id ? DB.myDates.find(x => x.id === id) : { type: 'Evento', notice: 15 };
  openForm({
    title: id ? 'Editar data' : 'Nova data importante', fields: [
      { k: 'name', label: 'Nome', value: d.name, full: true, required: true },
      { k: 'day', label: 'Dia', type: 'date', value: d.day, required: true },
      { k: 'type', label: 'Tipo', type: 'select', options: ['Sazonal', 'Evento', 'Cliente', 'Pessoal'], value: d.type },
      { k: 'clientId', label: 'Cliente vinculado', type: 'select', options: [['', '—'], ...clientOpts()], value: d.clientId || '' },
      { k: 'notice', label: 'Avisar quantos dias antes', type: 'number', value: d.notice },
      { k: 'repeat', label: 'Repetição', type: 'checkbox', cb: 'Repete todo ano', value: d.repeat, full: true },
    ], onSubmit: v => { if (id) Object.assign(d, v); else DB.myDates.push({ ...v, id: uid('d') }); toast('Data salva — ela já entra nos alertas'); }
  });
}
function formTask() {
  openForm({ title: 'Nova tarefa de hoje', fields: [{ k: 'title', label: 'O que fazer', full: true, required: true }, { k: 'date', label: 'Dia', type: 'date', value: iso(TODAY) }], onSubmit: v => DB.tasks.push({ ...v, id: uid('t'), done: false }) });
}
function toggleTask(id) { const t = DB.tasks.find(x => x.id === id); t.done = !t.done; save(); if (t.done) toast('Feito! ✨'); setTimeout(route, 350); document.querySelector(`[onclick*="${id}"]`)?.classList.toggle('on'); }
function delTask(id) { DB.tasks = DB.tasks.filter(t => t.id !== id); save(); route(); }
const stagePill = s => ({ 'Briefing': '', 'Em criação': 'pink', 'Em aprovação': 'yellow', 'Ajustes': 'danger', 'Finalizado': 'ok', 'Entregue': 'dark' }[s]);

/* ============ 2. CLIENTES ============ */
UI.clientView = 'cards'; UI.clientFilter = { q: '', niche: '', status: '' };
PAGES.clientes = (sub, id) => {
  if (sub === 'c' && id) return clientPage(id);
  const tabs = subTabs('clientes', NAV[1].subs, sub || 'todos');
  const head = pageHead('Clientes', 'Todo cliente que já passou pelo estúdio, organizado por nicho.', `<button class="btn primary" onclick="formClient()">${icon('plus')} Novo cliente</button>`);
  if (sub === 'pastas') return head + tabs + nichesView();
  if (sub === 'leads') return head + tabs + leadsView();
  if (sub === 'historico') return head + tabs + historyView();
  return head + tabs + clientsList();
};
function clientsList(onlyNiche) {
  const f = UI.clientFilter;
  let list = DB.clients.filter(c => c.status !== 'Encerrado');
  if (onlyNiche) list = list.filter(c => c.niches.includes(onlyNiche));
  if (f.q) list = list.filter(c => (c.brand + c.name).toLowerCase().includes(f.q.toLowerCase()));
  if (f.niche) list = list.filter(c => c.niches.includes(f.niche));
  if (f.status) list = list.filter(c => c.status === f.status);
  const toolbar = `<div class="toolbar"><input class="field-inline" placeholder="Filtrar por nome…" value="${esc(f.q)}" oninput="UI.clientFilter.q=this.value;clearTimeout(UI.ft);UI.ft=setTimeout(()=>{route();const i=document.querySelector('.toolbar input');i.focus();i.setSelectionRange(99,99)},250)">
    <select class="field-inline" onchange="UI.clientFilter.niche=this.value;route()"><option value="">Todos os nichos</option>${DB.niches.map(n => `<option value="${n.id}" ${f.niche === n.id ? 'selected' : ''}>${esc(n.name)}</option>`).join('')}</select>
    <select class="field-inline" onchange="UI.clientFilter.status=this.value;route()"><option value="">Todos os status</option>${['Lead', 'Ativo', 'Pausado'].map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <span class="grow"></span>
    <div class="seg"><button class="${UI.clientView === 'cards' ? 'on' : ''}" onclick="UI.clientView='cards';route()">${icon('grid')} Cards</button><button class="${UI.clientView === 'lista' ? 'on' : ''}" onclick="UI.clientView='lista';route()">${icon('list')} Lista</button></div></div>`;
  if (!list.length) return toolbar + empty('Nenhum cliente encontrado.', 'users', `<button class="btn primary" onclick="formClient()">${icon('plus')} Cadastrar cliente</button>`);
  if (UI.clientView === 'lista') return toolbar + `<div class="card table-wrap"><table class="table"><thead><tr><th>Cliente</th><th>Nicho</th><th>Serviço atual</th><th>Status</th><th class="right">Valor</th><th>Última interação</th></tr></thead><tbody>
    ${list.map(c => `<tr class="clickable" onclick="HASH.v='#/clientes/c/${c.id}'"><td><div style="display:flex;gap:10px;align-items:center">${clientLogo(c.id, 32)}<div><b>${esc(c.brand)}</b><div class="small muted">${esc(c.name)}</div></div></div></td><td class="small">${c.niches.map(n => DB.niches.find(x => x.id === n)?.name).join(', ')}</td><td>${esc(service(c.service)?.name || '—')}</td><td>${pill(c.status)}</td><td class="right num">${brl(c.value)}<div class="small muted">${c.valueType}</div></td><td class="small muted">${countdown(daysFromToday(c.last))}</td></tr>`).join('')}
  </tbody></table></div>`;
  return toolbar + `<div class="client-cards">${list.map(c => `<div class="card client-card hover" onclick="HASH.v='#/clientes/c/${c.id}'">
    <div class="stripe">${c.identity.palette.slice(0, 5).map(p => `<span style="background:${p.hex}"></span>`).join('')}</div>
    <div class="body"><div style="display:flex;gap:12px;align-items:center">${clientLogo(c.id, 44)}<div style="min-width:0"><h3 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.brand)}</h3><div class="small muted">${esc(c.name)}</div></div></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${pill(c.status)}${c.niches.map(n => `<span class="pill nodot">${esc(DB.niches.find(x => x.id === n)?.name)}</span>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;font-size:13px"><span class="muted">${esc(service(c.service)?.name || '—')}</span><b class="num">${brl(c.value)}${c.valueType === 'mensal' ? '/mês' : ''}</b></div>
    <div class="small muted">Última interação ${countdown(daysFromToday(c.last))}</div></div></div>`).join('')}</div>`;
}
function nichesView() {
  if (UI.nicheOpen) {
    const n = DB.niches.find(x => x.id === UI.nicheOpen);
    return `<div class="toolbar"><button class="btn" onclick="UI.nicheOpen=null;route()">${icon('chevL')} Pastas</button><h2>${esc(n.name)}</h2></div>` + clientsList(n.id);
  }
  return `<div class="grid g4">${DB.niches.map(n => { const c = DB.clients.filter(x => x.niches.includes(n.id)).length; return `<div class="folder" onclick="UI.nicheOpen='${n.id}';route()"><div class="fi">${icon('folder')}</div><div class="grow"><b>${esc(n.name)}</b><div class="small muted">${c} cliente${c === 1 ? '' : 's'}</div></div><button class="btn ghost sm" onclick="event.stopPropagation();renameNiche('${n.id}')" aria-label="Renomear">${icon('edit')}</button></div>`; }).join('')}
    <button class="note-add" style="min-height:72px" onclick="openForm({title:'Nova pasta de nicho',fields:[{k:'name',label:'Nome do nicho',full:true,required:true}],onSubmit:v=>DB.niches.push({id:uid('n'),name:v.name})})">${icon('plus')} Nova pasta</button></div>
    <p class="small muted" style="margin-top:14px">Um cliente pode estar em mais de uma pasta — edite os nichos na ficha do cliente.</p>`;
}
function renameNiche(id) { const n = DB.niches.find(x => x.id === id); openForm({ title: 'Renomear pasta', fields: [{ k: 'name', label: 'Nome', value: n.name, full: true }], onSubmit: v => n.name = v.name }); }
function historyView() {
  const list = DB.clients.filter(c => c.status === 'Encerrado');
  return `<div class="card">${list.length ? `<div class="list">${list.map(c => `<div class="row">${clientLogo(c.id, 36)}<div class="grow"><div class="title">${esc(c.brand)}</div><div class="sub">Último contato ${fmtDate(c.last)} · faturado ${brl(DB.payments.filter(p => p.clientId === c.id).reduce((s, p) => s + p.value, 0))}</div></div><a class="btn sm" href="#/clientes/c/${c.id}">${icon('eye')} Ver ficha</a><button class="btn primary sm" onclick="reactivate('${c.id}')">${icon('refresh')} Reativar</button></div>`).join('')}</div>` : empty('Nenhum cliente arquivado.', 'archive')}</div>`;
}
function reactivate(id) { const c = client(id); c.status = 'Ativo'; c.last = iso(TODAY); save(); route(); toast(`${c.brand} reativado`); }

/* leads (funil) */
function leadsView() {
  return `<p class="muted" style="margin-top:0">Arraste os cards entre as colunas. Ao mover para <b>Fechado</b>, o lead vira cliente e o sistema oferece gerar o contrato.</p>
  <div class="toolbar"><button class="btn primary sm" onclick="formLead()">${icon('plus')} Novo lead</button></div>
  <div class="kanban" data-board="leads">${LEAD_STAGES.map(s => { const ls = DB.leads.filter(l => l.stage === s); return `<div class="col" data-col="${s}"><div class="col-head"><span class="dot" style="background:${s === 'Fechado' ? 'var(--ok)' : s === 'Perdido' ? 'var(--danger)' : 'var(--pink)'}"></span>${s}<span class="n">${ls.length}</span></div>
    ${ls.map(l => `<div class="kcard" draggable="true" data-id="${l.id}" onclick="formLead('${l.id}')"><div class="t">${esc(l.brand)}</div><div class="small muted">${esc(l.name)}</div><div class="meta"><span>${esc(service(l.serviceId)?.name || '')}</span><b class="num" style="color:var(--text)">${brl(l.value)}</b></div><div class="meta"><span>${countdown(daysFromToday(l.date))}</span><a onclick="event.stopPropagation()" href="${waLink(l.contact)}" target="_blank" rel="noopener" style="display:inline-flex;gap:4px;align-items:center">${icon('whats').replace('<svg', '<svg style="width:14px"')} WhatsApp</a></div></div>`).join('')}</div>`; }).join('')}</div>`;
}
function formLead(id) {
  const l = id ? DB.leads.find(x => x.id === id) : { stage: 'Primeiro contato', date: iso(TODAY) };
  openForm({
    title: id ? 'Lead · ' + esc(l.brand) : 'Novo lead', fields: [
      { k: 'name', label: 'Nome', value: l.name, required: true }, { k: 'brand', label: 'Marca', value: l.brand, required: true },
      { k: 'contact', label: 'WhatsApp', value: l.contact, ph: '5511999999999' }, { k: 'niche', label: 'Nicho', type: 'select', options: opts(DB.niches), value: l.niche },
      { k: 'serviceId', label: 'Serviço de interesse', type: 'select', options: serviceOpts(), value: l.serviceId }, { k: 'value', label: 'Valor do orçamento', type: 'number', value: l.value },
      { k: 'stage', label: 'Etapa', type: 'select', options: LEAD_STAGES, value: l.stage, full: true },
    ], extra: id ? `<div class="actions" style="margin-top:14px"><button type="button" class="btn sm" onclick="copyQuote('${id}')">${icon('copy')} Copiar mensagem de orçamento</button></div>` : '',
    onSubmit: v => { if (id) { const wasClosed = l.stage === 'Fechado'; Object.assign(l, v); if (v.stage === 'Fechado' && !wasClosed) setTimeout(() => convertLead(l.id), 50); } else DB.leads.push({ ...v, id: uid('l'), date: iso(TODAY) }); }
  });
}
function copyQuote(id) {
  const l = DB.leads.find(x => x.id === id), s = service(l.serviceId);
  copyText(fillVars(DB.messages.find(m => m.id === 'm2').text, { nome: l.name.split(' ')[0], 'serviço': s.name, valor: brl(l.value), prazo: s.deadline, forma: s.payment }));
}
function convertLead(id) {
  const l = DB.leads.find(x => x.id === id); if (!l) return;
  if (DB.clients.find(c => c.fromLead === id)) return;
  const c = { id: uid('c'), fromLead: id, name: l.name, brand: l.brand, niches: l.niche ? [l.niche] : [], whatsapp: l.contact, instagram: '', email: '', doc: '', city: '', origin: 'Lead', status: 'Ativo', value: l.value, valueType: service(l.serviceId)?.monthly ? 'mensal' : 'projeto', service: l.serviceId, last: iso(TODAY), since: iso(TODAY),
    identity: { palette: [{ hex: '#FF5C90', name: 'Primária', role: 'primária' }], fontTitle: '', fontText: '', voice: '', words: '', avoid: '', dos: '', donts: '', logos: [] }, notes: [] };
  DB.clients.push(c); save(); confetti();
  UI.confirmYes = () => { UI.draftContract = { clientId: c.id, serviceId: l.serviceId }; HASH.v = '#/contratos/gerar'; };
  openModal(`${modalHead('🎉 Fechou! ' + esc(l.brand) + ' agora é cliente')}<div class="modal-body"><p style="margin:0">O cadastro foi criado com os dados do lead. Quer gerar o contrato agora? Cliente, serviço, valor e prazo já vêm preenchidos.</p></div>
    <div class="modal-foot"><button class="btn ghost" onclick="closeModal();HASH.v='#/clientes/c/${c.id}'">Ver ficha</button><button class="btn primary" onclick="const f=UI.confirmYes;closeModal();f()">${icon('file')} Gerar contrato</button></div>`);
}

/* ficha do cliente */
UI.clientTab = 'dados'; UI.neutral = {};
function clientTheme(c) {
  if (UI.neutral[c.id]) return null;
  const p = c.identity.palette; const by = r => p.find(x => x.role === r)?.hex;
  const primary = by('primária') || p[0]?.hex || '#FF5C90';
  const accent = by('destaque') || by('secundária') || primary;
  const bg = by('fundo') || '#FBF8F3';
  return { primary, accent, bg };
}
function clientPage(id) {
  const c = client(id); if (!c) return empty('Cliente não encontrado.');
  const th = clientTheme(c);
  const tabs = [['dados', 'Dados'], ['projetos', 'Projetos'], ['contratos', 'Contratos'], ['financeiro', 'Financeiro'], ['aprovacoes', 'Aprovações'], ['identidade', 'Identidade visual'], ['notas', 'Notas']];
  const cover = th ? `background:${th.primary};color:${inkOn(th.primary)}` : 'background:var(--ink);color:#fff';
  const titleFont = th && c.identity.fontTitle ? `font-family:'${c.identity.fontTitle}',var(--f-title)` : '';
  const logoBg = th ? th.accent : 'var(--pink)';
  const wa = waLink(c.whatsapp);
  let body = '';
  const t = UI.clientTab;
  if (t === 'dados') body = `<div class="grid g2"><div class="card"><div class="card-head"><h2>Dados</h2><button class="btn sm" onclick="formClient('${c.id}')">${icon('edit')} Editar</button></div>
      <div class="list">${[['Nome', c.name], ['Marca', c.brand], ['Instagram', c.instagram], ['E-mail', c.email], ['CPF/CNPJ', c.doc], ['Cidade', c.city], ['Como chegou', c.origin], ['Cliente desde', fmtDateLong(c.since)]].map(([k, v]) => `<div class="row"><span class="muted" style="width:120px">${k}</span><b class="grow">${esc(v || '—')}</b></div>`).join('')}</div></div>
      <div class="grid" style="align-content:start"><div class="card"><h2 style="margin-bottom:12px">Contato rápido</h2><div class="actions"><a class="btn primary" href="${wa}" target="_blank" rel="noopener">${icon('whats')} Abrir WhatsApp</a>${c.instagram ? `<a class="btn" href="https://instagram.com/${c.instagram.replace('@', '')}" target="_blank" rel="noopener">${icon('insta')} Instagram</a>` : ''}${c.email ? `<a class="btn" href="mailto:${esc(c.email)}">${icon('mail')} E-mail</a>` : ''}</div></div>
      <div class="card"><h2 style="margin-bottom:12px">Serviço atual</h2><div style="display:flex;justify-content:space-between;align-items:center"><div><b>${esc(service(c.service)?.name || '—')}</b><div class="small muted">${c.niches.map(n => DB.niches.find(x => x.id === n)?.name).join(' · ')}</div></div><span style="font-family:var(--f-title);font-size:22px;font-weight:700">${brl(c.value)}<span class="small muted">${c.valueType === 'mensal' ? '/mês' : ''}</span></span></div></div>
      <div class="card"><h2 style="margin-bottom:12px">Status</h2><div class="actions">${['Ativo', 'Pausado', 'Encerrado'].map(s => `<button class="btn sm ${c.status === s ? 'primary' : ''}" onclick="client('${c.id}').status='${s}';save();route()">${s}</button>`).join('')}</div></div></div></div>`;
  if (t === 'projetos') { const ps = DB.projects.filter(p => p.clientId === c.id); body = `<div class="card"><div class="card-head"><h2>Projetos</h2><button class="btn primary sm" onclick="formProject({clientId:'${c.id}'})">${icon('plus')} Projeto</button></div>${ps.length ? `<div class="list">${ps.map(p => `<div class="row clickable" onclick="HASH.v='#/projetos/p/${p.id}'"><div class="grow"><div class="title">${esc(p.title)}</div><div class="sub">${esc(service(p.serviceId)?.name)} · prazo ${fmtDate(p.due)}</div></div>${pill(p.stage, stagePill(p.stage))}<b class="num">${brl(p.value)}</b></div>`).join('')}</div>` : empty('Nenhum projeto ainda.')}</div>`; }
  if (t === 'contratos') { const ks = DB.contracts.filter(k => k.clientId === c.id); body = `<div class="card"><div class="card-head"><h2>Contratos</h2><button class="btn primary sm" onclick="UI.draftContract={clientId:'${c.id}'};HASH.v='#/contratos/gerar'">${icon('plus')} Gerar contrato</button></div>${ks.length ? `<div class="list">${ks.map(k => `<div class="row clickable" onclick="HASH.v='#/contratos/k/${k.id}'"><div class="grow"><div class="title">${esc(service(k.serviceId)?.name)}</div><div class="sub">criado em ${fmtDate(k.created)}${k.acceptedAt ? ' · aceito em ' + esc(k.acceptedAt) : ''}</div></div>${pill(k.status)}<b class="num">${brl(k.value)}</b></div>`).join('')}</div>` : empty('Nenhum contrato.')}</div>`; }
  if (t === 'financeiro') { const pg = DB.payments.filter(p => p.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date)); const rc = DB.receivables.filter(r => r.clientId === c.id && !r.paid); const tot = pg.reduce((s, p) => s + p.value, 0);
    body = `<div class="grid g3" style="margin-bottom:18px"><div class="card kpi"><div class="label">Total já faturado</div><div class="value">${brl(tot)}</div></div><div class="card kpi"><div class="label">Parcelas futuras</div><div class="value">${brl(rc.reduce((s, r) => s + r.value, 0))}</div></div><div class="card kpi"><div class="label">Pagamentos</div><div class="value">${pg.length}</div></div></div>
    <div class="grid g2"><div class="card"><div class="card-head"><h2>Pagamentos feitos</h2><button class="btn sm" onclick="formPayment({clientId:'${c.id}'})">${icon('plus')} Registrar</button></div><div class="list">${pg.map(p => `<div class="row"><div class="grow"><div class="title">${brl(p.value)}</div><div class="sub">${fmtDate(p.date)} · ${p.method} · ${p.type}</div></div>${pill('Pago', 'ok')}</div>`).join('') || empty('Nenhum pagamento.')}</div></div>
    <div class="card"><h2 style="margin-bottom:14px">Parcelas futuras</h2><div class="list">${rc.map(receivableRow).join('') || empty('Nada a receber.')}</div></div></div>`; }
  if (t === 'aprovacoes') { const as = DB.approvals.filter(a => a.clientId === c.id); body = `<div class="card"><h2 style="margin-bottom:14px">Peças enviadas</h2><div class="list">${as.map(approvalRow).join('') || empty('Nenhuma peça enviada.')}</div></div>`; }
  if (t === 'identidade') body = identityTab(c);
  if (t === 'notas') body = `<div class="card"><div class="card-head"><h2>Linha do tempo</h2></div>
    <form onsubmit="event.preventDefault();client('${c.id}').notes.unshift({d:iso(TODAY),t:this.t.value});client('${c.id}').last=iso(TODAY);save();route()" style="display:flex;gap:8px;margin-bottom:16px"><input name="t" class="field-inline" style="flex:1;border-radius:12px" placeholder="Anotação de reunião, preferência, combinado…" required><button class="btn primary">Adicionar</button></form>
    <div class="list">${c.notes.map(n => `<div class="row"><span class="pill nodot">${fmtDate(n.d)}</span><div class="grow">${esc(n.t)}</div></div>`).join('') || empty('Sem anotações ainda.')}</div></div>`;

  const style = th ? `--accent:${th.accent};--accent-ink:${inkOn(th.accent)};--pink-50:${mix(th.bg, th.accent, .08)}` : '';
  return `<div class="client-scope" style="${style}" data-bg="${th ? mix(th.bg, '#ffffff', .35) : ''}">
    <div class="crumbs"><a href="#/clientes/todos">Clientes</a> › ${esc(c.brand)}</div>
    <div class="cover" style="${cover}">
      ${c.identity.logoImg ? `<div class="client-logo" style="background:#fff;padding:8px"><img src="${c.identity.logoImg}" alt="" style="width:100%;height:100%;object-fit:contain"></div>` : `<div class="client-logo" style="background:${logoBg};color:${th ? inkOn(th.accent) : '#fff'}">${initials(c.brand)}</div>`}
      <div><h1 style="${titleFont}">${esc(c.brand)}</h1><div style="opacity:.85;margin-top:4px">${esc(c.name)} · ${esc(c.city || '')}</div><div style="margin-top:10px;display:flex;gap:6px">${c.identity.palette.slice(0, 5).map(p => `<span style="width:18px;height:18px;border-radius:6px;background:${p.hex};border:2px solid rgba(255,255,255,.5)"></span>`).join('')}</div></div>
      <div class="actions"><button class="btn sm" onclick="UI.neutral['${c.id}']=!UI.neutral['${c.id}'];route()">${icon('palette')} ${th ? 'Modo neutro' : 'Usar identidade da marca'}</button><a class="btn sm primary" href="${wa}" target="_blank" rel="noopener">${icon('whats')} WhatsApp</a></div>
    </div>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="${t === k ? 'on' : ''}" onclick="UI.clientTab='${k}';route()">${l}</button>`).join('')}</div>
    ${body}</div>`;
}
function identityTab(c) {
  const idt = c.identity;
  return `<div class="grid" style="gap:18px">
    ${brandDropzone(c.id)}
    <div class="card"><div class="card-head"><h2>Paleta</h2><div class="actions"><button class="btn sm" onclick="formPalette('${c.id}')">${icon('edit')} Editar paleta</button><button class="btn primary sm" onclick="exportBrandKit('${c.id}')">${icon('download')} Exportar brand kit</button></div></div>
      <div class="palette-big">${idt.palette.map(p => { const rgb = hexToRgb(p.hex), cmyk = rgbToCmyk(rgb); return `<div class="sw" onclick="copyText('${p.hex}','HEX ${p.hex} copiado')"><div class="c" style="background:${p.hex}"></div><div class="i"><b>${esc(p.name)}</b><span class="muted">${p.role}</span><br>HEX ${p.hex}<br>RGB ${rgb.join(', ')}<br>CMYK ${cmyk.join(', ')}</div></div>`; }).join('')}</div>
      <p class="small muted" style="margin:12px 0 0">Clique numa amostra para copiar o código. Dica: ao cadastrar o logo, a paleta é sugerida automaticamente a partir das cores da imagem.</p>
      <label class="btn sm" style="margin-top:10px">${icon('image')} Sugerir paleta a partir do logo<input type="file" accept="image/*" hidden onchange="paletteFromImage(this,'${c.id}')"></label></div>
    <div class="grid g2"><div class="card"><div class="card-head"><h2>Tipografia</h2><button class="btn sm" onclick="formIdentity('${c.id}')">${icon('edit')} Editar</button></div>
      <div style="font-family:'${esc(idt.fontTitle)}',var(--f-title);font-size:28px;font-weight:700;margin-bottom:4px">Aa · A beleza está no detalhe</div><div class="small muted" style="margin-bottom:14px">Títulos: ${esc(idt.fontTitle || '—')} · <a href="https://fonts.google.com/?query=${encodeURIComponent(idt.fontTitle || '')}" target="_blank" rel="noopener">baixar</a></div>
      <div style="font-family:'${esc(idt.fontText)}',var(--f-text);font-size:15px">O texto corrido usa uma fonte neutra e legível para todas as peças.</div><div class="small muted">Textos: ${esc(idt.fontText || '—')}</div></div>
    <div class="card"><h2 style="margin-bottom:12px">Logos</h2><div class="grid g3" style="gap:10px">${(idt.logos.length ? idt.logos : ['Principal']).map((l, i) => `<div style="border-radius:12px;overflow:hidden;border:1px solid var(--line)"><div style="height:64px;display:grid;place-items:center;background:${i % 2 ? (idt.palette[0]?.hex || '#333') : '#fff'};color:${i % 2 ? inkOn(idt.palette[0]?.hex || '#333') : (idt.palette[0]?.hex || '#333')};font-family:'${esc(idt.fontTitle)}',var(--f-title);font-weight:700">${initials(c.brand)}</div><div class="small" style="padding:6px 8px">${esc(l)}</div></div>`).join('')}</div><p class="small muted" style="margin:10px 0 0">Download em PNG · SVG · PDF</p></div></div>
    <div class="grid g3"><div class="card"><h3 style="margin-bottom:8px">Tom de voz</h3><p class="small" style="margin:0 0 8px">${esc(idt.voice || '—')}</p><p class="small" style="margin:0"><b>Usa:</b> ${esc(idt.words || '—')}<br><b>Evita:</b> ${esc(idt.avoid || '—')}</p></div>
      <div class="card"><h3 style="margin-bottom:8px">Regras de uso</h3><p class="small" style="margin:0 0 6px"><span class="pill ok">Faça</span> ${esc(idt.dos || '—')}</p><p class="small" style="margin:0"><span class="pill danger">Não faça</span> ${esc(idt.donts || '—')}</p></div>
      <div class="card"><h3 style="margin-bottom:8px">Documentos e moodboard</h3><div class="list small">${(idt.docs || []).map(d => `<div class="row">${icon('file').replace('<svg', '<svg style="width:16px"')} ${esc(d)} <span class="pill ok nodot" style="margin-left:auto">lido</span></div>`).join('')}<div class="row">${icon('file').replace('<svg', '<svg style="width:16px"')} Manual da marca.pdf</div><div class="row">${icon('file').replace('<svg', '<svg style="width:16px"')} Apresentação de entrega.pdf</div><div class="row">${icon('image').replace('<svg', '<svg style="width:16px"')} Moodboard (12 referências)</div></div></div></div>
  </div>`;
}
function formPalette(cid) {
  const c = client(cid);
  openForm({ title: 'Paleta de ' + esc(c.brand), wide: true, fields: c.identity.palette.flatMap((p, i) => [
    { k: 'hex' + i, label: `Cor ${i + 1}`, type: 'color', value: p.hex }, { k: 'name' + i, label: 'Nome', value: p.name },
  ]).concat([{ k: 'roles', label: 'Funções na ordem (separadas por vírgula)', value: c.identity.palette.map(p => p.role).join(', '), full: true }, { k: 'add', label: 'Adicionar', type: 'checkbox', cb: 'Adicionar mais uma cor', full: true }]),
    onSubmit: v => { const roles = v.roles.split(',').map(s => s.trim()); c.identity.palette = c.identity.palette.map((p, i) => ({ hex: v['hex' + i], name: v['name' + i], role: roles[i] || p.role })); if (v.add) c.identity.palette.push({ hex: '#cccccc', name: 'Nova cor', role: 'apoio' }); toast('Paleta atualizada — a página do cliente já se vestiu com ela'); } });
}
function formIdentity(cid) {
  const i = client(cid).identity;
  openForm({ title: 'Identidade visual', fields: [
    { k: 'fontTitle', label: 'Fonte de título', value: i.fontTitle }, { k: 'fontText', label: 'Fonte de texto', value: i.fontText },
    { k: 'voice', label: 'Tom de voz', type: 'textarea', value: i.voice, full: true }, { k: 'words', label: 'Palavras que usa', value: i.words }, { k: 'avoid', label: 'Palavras que evita', value: i.avoid },
    { k: 'dos', label: 'Faça', type: 'textarea', value: i.dos }, { k: 'donts', label: 'Não faça', type: 'textarea', value: i.donts }], onSubmit: v => Object.assign(i, v) });
}
function paletteFromImage(input, cid) {
  const file = input.files[0]; if (!file) return;
  const img = new Image(); img.onload = () => {
    const cv = document.createElement('canvas'); const s = 64; cv.width = s; cv.height = s; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, s, s);
    const d = ctx.getImageData(0, 0, s, s).data; const buckets = {};
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const k = [d[i], d[i + 1], d[i + 2]].map(v => Math.round(v / 32) * 32).map(v => Math.min(255, v)); const key = k.join(','); buckets[key] = (buckets[key] || 0) + 1; }
    const top = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => '#' + k.split(',').map(v => (+v).toString(16).padStart(2, '0')).join(''));
    const roles = ['primária', 'secundária', 'destaque', 'fundo', 'texto'];
    UI.suggest = top;
    openModal(`${modalHead('Paleta sugerida pelo logo')}<div class="modal-body"><div class="palette-big">${top.map((h, i) => `<div class="sw"><div class="c" style="background:${h}"></div><div class="i"><b>${h}</b>${roles[i]}</div></div>`).join('')}</div><p class="small muted">Confirme para usar ou ajuste depois em “Editar paleta”.</p></div>
      <div class="modal-foot"><button class="btn ghost" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="client('${cid}').identity.palette=UI.suggest.map((h,i)=>({hex:h,name:'Cor '+(i+1),role:['primária','secundária','destaque','fundo','texto'][i]}));save();closeModal();route()">Usar esta paleta</button></div>`);
    URL.revokeObjectURL(img.src);
  }; img.src = URL.createObjectURL(file);
}
function exportBrandKit(cid) {
  const c = client(cid), i = c.identity, w = window.open('', '_blank');
  if (!w) { toast('Não deu para abrir a janela do PDF aqui. Abra o Núcleo direto no navegador do computador para gerar o PDF.', 'alert'); return; }
  w.document.write(`<!doctype html><html><head><title>Brand kit · ${esc(c.brand)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Sora:wght@700&display=swap" rel="stylesheet"><style>body{font-family:Inter,sans-serif;margin:40px;color:#2c2c2c}h1{font-family:Sora;font-size:34px;margin:0}.p{display:flex;gap:12px;margin:24px 0}.p div{flex:1;border-radius:12px;overflow:hidden;border:1px solid #eee;font-size:12px}.p span{display:block;height:90px}.p p{margin:8px}.bar{height:8px;background:#FF5C90;border-radius:4px;margin:16px 0 28px}@page{size:A4;margin:16mm}</style></head><body>
  <h1>${esc(c.brand)}</h1><div style="color:#777">Brand kit · gerado pelo Studio Sun</div><div class="bar" style="background:${i.palette[0]?.hex}"></div>
  <h3>Paleta</h3><div class="p">${i.palette.map(p => `<div><span style="background:${p.hex}"></span><p><b>${esc(p.name)}</b><br>${p.role}<br>HEX ${p.hex}<br>RGB ${hexToRgb(p.hex).join(', ')}<br>CMYK ${rgbToCmyk(hexToRgb(p.hex)).join(', ')}</p></div>`).join('')}</div>
  <h3>Tipografia</h3><p>Títulos: <b>${esc(i.fontTitle)}</b> · Textos: <b>${esc(i.fontText)}</b></p><h3>Tom de voz</h3><p>${esc(i.voice)}</p><h3>Regras de uso</h3><p>✔ ${esc(i.dos)}<br>✘ ${esc(i.donts)}</p>
  <script>setTimeout(()=>print(),600)<\/script></body></html>`);
  w.document.close();
}
function formClient(id) {
  const c = id ? client(id) : { status: 'Ativo', valueType: 'projeto', niches: [] };
  openForm({
    title: id ? 'Editar cliente' : 'Novo cliente', wide: true, fields: [
      { k: 'name', label: 'Nome', value: c.name, required: true }, { k: 'brand', label: 'Marca', value: c.brand, required: true },
      { k: 'whatsapp', label: 'WhatsApp (com DDD)', value: c.whatsapp, ph: '5511999999999' }, { k: 'instagram', label: 'Instagram', value: c.instagram, ph: '@marca' },
      { k: 'email', label: 'E-mail', type: 'email', value: c.email }, { k: 'doc', label: 'CPF/CNPJ', value: c.doc },
      { k: 'city', label: 'Cidade', value: c.city }, { k: 'origin', label: 'Como chegou até você', type: 'select', options: ['Indicação', 'Instagram', 'Google', 'WhatsApp', 'Lead', 'Outro'], value: c.origin },
      { k: 'niches', label: 'Pastas por nicho (Ctrl/⌘ para várias)', type: 'select', multiple: true, options: opts(DB.niches), value: c.niches },
      { k: 'service', label: 'Serviço atual', type: 'select', options: serviceOpts(), value: c.service },
      { k: 'status', label: 'Status', type: 'select', options: ['Lead', 'Ativo', 'Pausado', 'Encerrado'], value: c.status },
      { k: 'value', label: 'Valor (R$)', type: 'number', value: c.value }, { k: 'valueType', label: 'Tipo de valor', type: 'select', options: ['mensal', 'projeto'], value: c.valueType },
      { k: 'color', label: 'Cor principal da marca', type: 'color', value: c.identity?.palette?.[0]?.hex || '#FF5C90' },
    ], onSubmit: v => {
      const col = v.color; delete v.color;
      if (id) { Object.assign(c, v); c.identity.palette[0] && (c.identity.palette[0].hex = col); toast('Cliente atualizado'); }
      else { const nc = { ...v, id: uid('c'), last: iso(TODAY), since: iso(TODAY), notes: [], identity: { palette: [{ hex: col, name: 'Primária', role: 'primária' }], fontTitle: '', fontText: '', voice: '', words: '', avoid: '', dos: '', donts: '', logos: [] } }; DB.clients.push(nc); toast('Cliente cadastrado — ele já aparece em contratos, projetos e financeiro'); setTimeout(() => HASH.v = '#/clientes/c/' + nc.id, 30); }
    }
  });
}

/* ============ 3. SERVIÇOS ============ */
PAGES.servicos = (sub) => {
  sub = sub || 'catalogo';
  const head = pageHead('Serviços', 'O cardápio do estúdio: alimenta orçamentos, contratos, projetos e precificação.', sub === 'catalogo' ? `<button class="btn primary" onclick="formService()">${icon('plus')} Novo serviço</button>` : sub === 'pacotes' ? `<button class="btn primary" onclick="formPackage()">${icon('plus')} Novo pacote</button>` : '');
  const tabs = subTabs('servicos', NAV[2].subs, sub);
  if (sub === 'pacotes') return head + tabs + `<div class="grid g3">${DB.packages.map(p => `<div class="card hover"><div class="card-head"><h2>${esc(p.name)}</h2>${p.monthly ? pill('Mensal', 'pink') : pill('Avulso')}</div><p class="muted" style="margin:0 0 14px">${esc(p.items)}</p><div style="font-family:var(--f-title);font-size:28px;font-weight:700">${brl(p.price)}<span class="small muted">${p.monthly ? '/mês' : ''}</span></div>${p.monthly ? '<p class="small muted">Gera cobrança recorrente automática em A receber.</p>' : ''}<button class="btn sm" onclick="formPackage('${p.id}')">${icon('edit')} Editar</button></div>`).join('')}</div>`;
  if (sub === 'processos') return head + tabs + `<div class="grid g2">${DB.services.map(s => `<div class="card"><div class="card-head"><h3>${esc(s.name)}</h3><div class="actions"><button class="btn ghost sm" onclick="formProcess('${s.id}')">${icon('edit')}</button><button class="btn sm" onclick="processPdf('${s.id}')">${icon('download')} PDF</button></div></div><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${s.process.map((p, i) => `<span class="pill ${i === 0 ? 'pink' : ''} nodot">${i + 1}. ${esc(p)}</span>${i < s.process.length - 1 ? '<span class="muted">→</span>' : ''}`).join('')}</div></div>`).join('')}</div><p class="small muted">Ao criar um projeto, essas etapas viram checklist automaticamente.</p>`;
  if (sub === 'briefings') return head + tabs + `<div class="grid g2">${DB.services.map(s => { const q = DB.briefings[s.id] || []; return `<div class="card"><div class="card-head"><h3>${esc(s.name)}</h3><span class="pill nodot">${q.length} perguntas</span></div>${q.length ? `<ol class="small" style="margin:0 0 12px;padding-left:18px;color:var(--muted)">${q.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '<p class="small muted">Nenhuma pergunta ainda.</p>'}<div class="actions"><button class="btn sm" onclick="formBriefing('${s.id}')">${icon('edit')} Editar perguntas</button>${q.length ? `<button class="btn primary sm" onclick="copyText('https://nucleo.studiosun.app/briefing/${s.id}','Link do briefing copiado')">${icon('link')} Copiar link</button>` : ''}</div></div>`; }).join('')}</div>`;
  return head + tabs + `<div class="grid g3">${DB.services.map(s => { const sug = suggestedPrice(s); return `<div class="card hover" style="display:flex;flex-direction:column;gap:10px">
    <div class="card-head" style="margin:0"><h2>${esc(s.name)}</h2><button class="btn ghost sm" onclick="formService('${s.id}')" aria-label="Editar">${icon('edit')}</button></div>
    <p class="muted" style="margin:0">${esc(s.desc)}</p>
    <div class="small"><b>Inclui:</b> ${esc(s.includes)}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${pill(s.deadline, 'nodot')}${pill(s.changes + ' alterações', 'nodot')}${pill(s.hours + 'h estimadas', 'nodot')}</div>
    <div class="small muted">${esc(s.payment)}</div>
    <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:end;border-top:1px solid var(--line);padding-top:12px"><div><div style="font-family:var(--f-title);font-size:24px;font-weight:700">${s.price ? brl(s.price) : '<span class="muted" style="font-size:16px">a definir</span>'}</div>${s.price && s.price < sug ? `<span class="pill danger">abaixo do sugerido</span>` : ''}</div><div class="small muted right">sugerido<br><b style="color:var(--text)">${brl(sug)}</b></div></div></div>`; }).join('')}</div>`;
};
function formService(id) {
  const s = id ? service(id) : { process: ['Briefing', 'Criação', 'Aprovação', 'Ajustes', 'Entrega'], changes: 2, hours: 5 };
  openForm({ title: id ? 'Editar serviço' : 'Novo serviço', wide: true, fields: [
    { k: 'name', label: 'Nome', value: s.name, required: true, full: true }, { k: 'desc', label: 'Descrição curta', value: s.desc, full: true },
    { k: 'includes', label: 'O que está incluso', type: 'textarea', value: s.includes, full: true },
    { k: 'price', label: 'Preço (R$, 0 = a definir)', type: 'number', value: s.price }, { k: 'deadline', label: 'Prazo', value: s.deadline },
    { k: 'payment', label: 'Forma de pagamento', value: s.payment }, { k: 'changes', label: 'Alterações inclusas', type: 'number', value: s.changes },
    { k: 'hours', label: 'Custo estimado (horas)', type: 'number', step: '0.5', value: s.hours }, { k: 'monthly', label: 'Recorrência', type: 'checkbox', cb: 'Serviço mensal', value: s.monthly },
  ], onSubmit: v => { if (id) Object.assign(s, v); else DB.services.push({ ...s, ...v, id: uid('s') }); toast('Serviço salvo'); } });
}
function formPackage(id) { const p = id ? DB.packages.find(x => x.id === id) : {}; openForm({ title: id ? 'Editar pacote' : 'Novo pacote', fields: [{ k: 'name', label: 'Nome', value: p.name, full: true, required: true }, { k: 'items', label: 'O que inclui', value: p.items, full: true }, { k: 'price', label: 'Preço', type: 'number', value: p.price }, { k: 'monthly', label: 'Tipo', type: 'checkbox', cb: 'Plano mensal', value: p.monthly }], onSubmit: v => { if (id) Object.assign(p, v); else DB.packages.push({ ...v, id: uid('pk') }); } }); }
function formProcess(id) { const s = service(id); openForm({ title: 'Etapas · ' + esc(s.name), fields: [{ k: 'p', label: 'Uma etapa por linha', type: 'textarea', value: s.process.join('\n'), full: true }], onSubmit: v => s.process = v.p.split('\n').map(x => x.trim()).filter(Boolean) }); }
function formBriefing(id) { openForm({ title: 'Briefing · ' + esc(service(id).name), fields: [{ k: 'q', label: 'Uma pergunta por linha', type: 'textarea', value: (DB.briefings[id] || []).join('\n'), full: true }], onSubmit: v => DB.briefings[id] = v.q.split('\n').map(x => x.trim()).filter(Boolean) }); }
function processPdf(id) {
  const s = service(id), w = window.open('', '_blank'); if (!w) return toast('Não deu para abrir a janela do PDF aqui. Abra o Núcleo direto no navegador do computador para gerar o PDF.', 'alert');
  w.document.write(`<!doctype html><html><head><title>Processo · ${esc(s.name)}</title><style>body{font-family:Inter,system-ui,sans-serif;margin:48px;color:#2c2c2c}h1{font-family:Sora,sans-serif;color:#FF5C90}.s{display:flex;gap:16px;align-items:center;margin:14px 0}.n{width:38px;height:38px;border-radius:50%;background:#FF5C90;color:#fff;display:grid;place-items:center;font-weight:700}</style></head><body><div style="color:#888">Studio Sun · Processo de trabalho</div><h1>${esc(s.name)}</h1>${s.process.map((p, i) => `<div class="s"><div class="n">${i + 1}</div><b>${esc(p)}</b></div>`).join('')}<p style="margin-top:30px;color:#777">Prazo: ${esc(s.deadline)} · Alterações inclusas: ${s.changes} · Pagamento: ${esc(s.payment)}</p><script>setTimeout(()=>print(),400)<\/script></body></html>`); w.document.close();
}

/* ============ 4. PROJETOS ============ */
UI.projFilter = { client: '', service: '', stage: '', month: '' };
PAGES.projetos = (sub, id) => {
  if (sub === 'p' && id) return projectPage(id);
  sub = sub || 'quadro';
  const head = pageHead('Projetos', 'Cada trabalho fechado vira um projeto. Arraste os cards entre as etapas.', `<button class="btn primary" onclick="formProject()">${icon('plus')} Novo projeto</button>`);
  const tabs = subTabs('projetos', NAV[3].subs, sub);
  if (sub === 'lista') return head + tabs + projectList();
  if (sub === 'calendario') return head + tabs + monthCalendar(UI.calMonth || curYM, day => DB.projects.filter(p => p.due === day).map(p => `<div class="ev prazo" style="${daysFromToday(p.due) < 0 && p.stage !== 'Entregue' ? 'background:var(--danger);color:#fff' : ''}" onclick="HASH.v='#/projetos/p/${p.id}'" title="${esc(p.title)}">${esc(p.title)}</div>`).join(''));
  if (sub === 'alteracoes') { const pend = DB.projects.flatMap(p => p.changes.map((c, i) => ({ ...c, i, p }))).filter(x => !x.done);
    return head + tabs + `<div class="card">${pend.length ? `<div class="list">${pend.map(x => `<div class="row">${checkBtn(false, `doChange('${x.p.id}',${x.i})`)}<div class="grow"><div class="title">${esc(x.t)}</div><div class="sub">${esc(x.p.title)} · ${esc(clientName(x.p.clientId))}</div></div><a class="btn sm" href="#/projetos/p/${x.p.id}">Abrir projeto</a></div>`).join('')}</div>` : empty('Nenhuma alteração pendente 🎉', 'checkCircle')}</div>`; }
  return head + tabs + `<div class="kanban" data-board="projects">${STAGES.map(s => { const ps = DB.projects.filter(p => p.stage === s); return `<div class="col" data-col="${s}"><div class="col-head"><span class="dot" style="background:${STAGE_COLOR[s]}"></span>${s}<span class="n">${ps.length}</span></div>${ps.map(projectCard).join('')}</div>`; }).join('')}</div>`;
};
function projectCard(p) {
  const n = daysFromToday(p.due), late = n < 0 && !['Finalizado', 'Entregue'].includes(p.stage), over = p.changesUsed > p.changesIncluded;
  return `<div class="kcard" draggable="true" data-id="${p.id}" style="border-left-color:${clientColor(p.clientId)}" onclick="HASH.v='#/projetos/p/${p.id}'">
    <div style="display:flex;gap:8px;align-items:center">${clientLogo(p.clientId, 24)}<span class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(clientName(p.clientId))}</span></div>
    <div class="t">${esc(p.title)}</div>
    <div class="meta"><span>${esc(service(p.serviceId)?.name || '')}</span></div>
    <div class="meta"><span class="${late ? 'late' : ''}">${icon('clock').replace('<svg', '<svg style="width:13px;vertical-align:-2px"')} ${late ? 'atrasado · ' : ''}${fmtDate(p.due)}</span><span class="pill ${over ? 'danger' : ''} nodot" title="Alterações usadas / inclusas">${p.changesUsed} de ${p.changesIncluded}</span><b class="num" style="color:var(--text)">${brl(p.value)}</b></div>
  </div>`;
}
function projectList() {
  const f = UI.projFilter;
  let ps = DB.projects.filter(p => (!f.client || p.clientId === f.client) && (!f.service || p.serviceId === f.service) && (!f.stage || p.stage === f.stage) && (!f.month || ym(p.due) === f.month));
  const months = [...new Set(DB.projects.map(p => ym(p.due)))].sort().reverse();
  return `<div class="toolbar"><select class="field-inline" onchange="UI.projFilter.client=this.value;route()"><option value="">Todos os clientes</option>${DB.clients.map(c => `<option value="${c.id}" ${f.client === c.id ? 'selected' : ''}>${esc(c.brand)}</option>`).join('')}</select>
    <select class="field-inline" onchange="UI.projFilter.service=this.value;route()"><option value="">Todos os serviços</option>${DB.services.map(s => `<option value="${s.id}" ${f.service === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
    <select class="field-inline" onchange="UI.projFilter.stage=this.value;route()"><option value="">Todos os status</option>${STAGES.map(s => `<option ${f.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <select class="field-inline" onchange="UI.projFilter.month=this.value;route()"><option value="">Todos os meses</option>${months.map(m => `<option value="${m}" ${f.month === m ? 'selected' : ''}>${ymLabel(m)}</option>`).join('')}</select></div>
  <div class="card table-wrap"><table class="table"><thead><tr><th>Projeto</th><th>Cliente</th><th>Serviço</th><th>Status</th><th>Prazo</th><th>Alterações</th><th class="right">Valor</th></tr></thead><tbody>
  ${ps.map(p => `<tr class="clickable" onclick="HASH.v='#/projetos/p/${p.id}'"><td><b>${esc(p.title)}</b></td><td>${esc(clientName(p.clientId))}</td><td class="small">${esc(service(p.serviceId)?.name)}</td><td>${pill(p.stage, stagePill(p.stage))}</td><td class="${daysFromToday(p.due) < 0 && !['Finalizado', 'Entregue'].includes(p.stage) ? 'late' : ''}" style="${daysFromToday(p.due) < 0 && !['Finalizado', 'Entregue'].includes(p.stage) ? 'color:var(--danger);font-weight:700' : ''}">${fmtDate(p.due)}</td><td>${p.changesUsed} de ${p.changesIncluded}</td><td class="right num">${brl(p.value)}</td></tr>`).join('') || `<tr><td colspan="7">${empty('Nenhum projeto com esses filtros.')}</td></tr>`}
  </tbody></table></div>`;
}
function monthCalendar(k, cellFn, nav = true) {
  const [y, m] = k.split('-').map(Number); const first = new Date(y, m - 1, 1); const start = addDays(first, -first.getDay());
  const cells = []; for (let i = 0; i < 42; i++) { const d = addDays(start, i); if (i >= 35 && d.getMonth() !== m - 1) break; cells.push(d); }
  return `${nav ? `<div class="toolbar"><button class="btn sm" onclick="UI.calMonth=prevYM('${k}');route()">${icon('chevL')}</button><h2 style="text-transform:capitalize;min-width:180px;text-align:center">${ymLabel(k)}</h2><button class="btn sm" onclick="UI.calMonth=prevYM('${k}',-1);route()">${icon('chev')}</button><button class="btn ghost sm" onclick="UI.calMonth=null;route()">Hoje</button></div>` : ''}
  <div class="cal">${WEEK.map(w => `<div class="dh">${w}</div>`).join('')}${cells.map(d => { const s = iso(d); return `<div class="day ${d.getMonth() !== m - 1 ? 'out' : ''} ${s === iso(TODAY) ? 'today' : ''}"><span class="dn">${d.getDate()}</span>${cellFn(s)}</div>`; }).join('')}</div>`;
}
function doChange(pid, i) { const p = project(pid); p.changes[i].done = true; save(); toast('Alteração concluída'); setTimeout(route, 300); }

function projectPage(id) {
  const p = project(id); if (!p) return empty('Projeto não encontrado.');
  const done = p.checklist.filter(c => c.done).length, pct = p.checklist.length ? Math.round(done / p.checklist.length * 100) : 0;
  const cost = projectCost(p.id), est = (service(p.serviceId)?.hours || 0), realCost = p.hours * hourRate() + cost;
  const running = DB.timer && DB.timer.pid === p.id;
  const over = p.changesUsed > p.changesIncluded;
  return `${pageHead(esc(p.title), `${clientLogo(p.clientId, 22).replace('class="client-logo"', 'class="client-logo" style="display:inline-grid;vertical-align:middle;margin-right:6px"')}<a href="#/clientes/c/${p.clientId}">${esc(clientName(p.clientId))}</a> · ${esc(service(p.serviceId)?.name)} · prazo ${fmtDate(p.due)} (${countdown(daysFromToday(p.due))})`,
    `<select class="field-inline" onchange="moveProject('${p.id}',this.value)">${STAGES.map(s => `<option ${p.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn" onclick="formProject(null,'${p.id}')">${icon('edit')} Editar</button><button class="btn primary" onclick="formApproval('${p.id}')">${icon('send')} Enviar para aprovação</button>`,
    `<a href="#/projetos/quadro">Projetos</a> › ${esc(p.title)}`)}
  <div class="grid g3">
    <div class="card span2"><div class="card-head"><h2>Etapas</h2><span class="muted">${done} de ${p.checklist.length}</span></div><div class="progress pink" style="margin-bottom:12px;height:8px"><span style="width:${pct}%"></span></div>
      <div class="list">${p.checklist.map((c, i) => `<div class="row ${c.done ? 'done' : ''}">${checkBtn(c.done, `toggleStep('${p.id}',${i})`)}<div class="grow title">${esc(c.t)}</div></div>`).join('')}</div></div>
    <div class="grid" style="align-content:start">
      <div class="card"><h2 style="margin-bottom:10px">${icon('clock').replace('<svg', '<svg style="width:18px;vertical-align:-3px"')} Horas trabalhadas</h2>
        <div style="font-family:var(--f-title);font-size:32px;font-weight:700" id="timer-display">${fmtHours(p.hours + (running ? (Date.now() - DB.timer.start) / 36e5 : 0))}</div>
        <div class="small muted" style="margin-bottom:10px">estimado: ${est}h · ${p.hours > est ? `<b style="color:var(--danger)">${(p.hours - est).toFixed(1)}h acima</b>` : 'dentro do previsto'}</div>
        <button class="btn ${running ? 'dark' : 'primary'}" onclick="toggleTimer('${p.id}')">${icon(running ? 'pause' : 'play')} ${running ? 'Pausar' : 'Iniciar'} cronômetro</button></div>
      <div class="card"><h2 style="margin-bottom:10px">Lucro do projeto</h2><div class="list small"><div class="row"><span class="grow muted">Valor</span><b>${brl(p.value)}</b></div><div class="row"><span class="grow muted">Horas × valor-hora</span><b>− ${brl(p.hours * hourRate())}</b></div><div class="row"><span class="grow muted">Custos do projeto</span><b>− ${brl(cost)}</b></div><div class="row"><span class="grow"><b>Lucro real</b></span><b style="color:${p.value - realCost >= 0 ? 'var(--ok)' : 'var(--danger)'}">${brl(p.value - realCost)}</b></div></div></div>
    </div>
    <div class="card"><div class="card-head"><h2>Pedidos de alteração</h2><span class="pill ${over ? 'danger' : 'yellow'}">${p.changesUsed} de ${p.changesIncluded}</span></div>
      ${over ? `<div class="pill danger nodot" style="margin-bottom:10px;white-space:normal">Passou do incluso — combine o valor da alteração extra.</div>` : ''}
      <div class="list">${p.changes.map((c, i) => `<div class="row ${c.done ? 'done' : ''}">${checkBtn(c.done, `toggleChange('${p.id}',${i})`)}<div class="grow title" style="white-space:normal">${esc(c.t)}</div></div>`).join('') || '<p class="muted small">Nenhum pedido.</p>'}</div>
      <form onsubmit="event.preventDefault();addChange('${p.id}',this.t.value)" style="display:flex;gap:6px;margin-top:10px"><input name="t" class="field-inline" style="flex:1" placeholder="Novo pedido…" required><button class="btn sm">${icon('plus')}</button></form></div>
    <div class="card"><div class="card-head"><h2>Arquivos e versões</h2><button class="btn sm" onclick="addVersion('${p.id}')">${icon('plus')} Versão</button></div><div class="list">${p.versions.map((v, i) => `<div class="row"><span class="pill ${v === 'Final' ? 'ok' : 'pink'} nodot">${v}</span><div class="grow small">${esc(p.title)} — ${v}.png</div>${icon('download').replace('<svg', '<svg style="width:16px;color:var(--muted)"')}</div>`).join('') || '<p class="muted small">Nenhuma versão ainda.</p>'}</div></div>
    <div class="card"><h2 style="margin-bottom:12px">Histórico</h2><div class="list">${[...p.history].reverse().map(h => `<div class="row small"><span class="muted" style="width:48px">${fmtDate(h.d)}</span><span class="grow">${esc(h.t)}</span></div>`).join('')}</div></div>
  </div>`;
}
const fmtHours = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${hh}h${pad(mm)}`; };
function toggleStep(pid, i) { const p = project(pid); p.checklist[i].done = !p.checklist[i].done; if (p.checklist[i].done) p.history.push({ d: iso(TODAY), t: `Etapa “${p.checklist[i].t}” concluída` }); save(); setTimeout(route, 320); document.activeElement?.classList.toggle('on'); }
function toggleChange(pid, i) { const p = project(pid); p.changes[i].done = !p.changes[i].done; save(); setTimeout(route, 320); document.activeElement?.classList.toggle('on'); }
function addChange(pid, t) { const p = project(pid); p.changes.push({ t, done: false }); p.changesUsed++; p.history.push({ d: iso(TODAY), t: 'Pedido de alteração: ' + t }); save(); route(); if (p.changesUsed > p.changesIncluded) toast(`Atenção: ${p.changesUsed} de ${p.changesIncluded} alterações — passou do incluso`, 'alert'); }
function addVersion(pid) { const p = project(pid); const v = 'V' + (p.versions.filter(x => x.startsWith('V')).length + 1); p.versions.push(v); p.history.push({ d: iso(TODAY), t: `Versão ${v} adicionada` }); save(); route(); }
function moveProject(pid, stage) {
  const p = project(pid); if (p.stage === stage) return; p.stage = stage; p.history.push({ d: iso(TODAY), t: `Movido para ${stage}` });
  if (stage === 'Entregue') toast('Entregue! Lembre de mandar a mensagem de entrega e a cobrança final 💗');
  save(); route();
}
function toggleTimer(pid) {
  if (DB.timer && DB.timer.pid === pid) { const p = project(pid); p.hours = Math.round((p.hours + (Date.now() - DB.timer.start) / 36e5) * 100) / 100; DB.timer = null; toast('Tempo registrado'); }
  else { if (DB.timer) { const o = project(DB.timer.pid); o.hours += (Date.now() - DB.timer.start) / 36e5; } DB.timer = { pid, start: Date.now() }; }
  save(); route();
}
setInterval(() => { if (DB.timer) { const el = document.getElementById('timer-display'); const p = project(DB.timer.pid); if (el && HASH.v.includes(DB.timer.pid)) el.textContent = fmtHours(p.hours + (Date.now() - DB.timer.start) / 36e5); } }, 1000);
function formProject(pre = {}, id) {
  pre = pre || {};
  const p = id ? project(id) : { ...pre };
  openForm({ title: id ? 'Editar projeto' : 'Novo projeto', fields: [
    { k: 'title', label: 'Nome do projeto', value: p.title, full: true, required: true },
    { k: 'clientId', label: 'Cliente', type: 'select', options: clientOpts(), value: p.clientId }, { k: 'serviceId', label: 'Serviço', type: 'select', options: serviceOpts(), value: p.serviceId },
    { k: 'due', label: 'Prazo', type: 'date', value: p.due || rel(10) }, { k: 'value', label: 'Valor (R$)', type: 'number', value: p.value },
    { k: 'changesIncluded', label: 'Alterações inclusas (vazio = do serviço)', type: 'number', value: p.changesIncluded },
  ], onSubmit: v => {
    const s = service(v.serviceId);
    if (id) { Object.assign(p, v); return; }
    const np = { id: uid('p'), ...v, value: v.value || s.price || 0, changesIncluded: v.changesIncluded === '' ? s.changes : v.changesIncluded, stage: 'Briefing', changesUsed: 0, checklist: s.process.map(t => ({ t, done: false })), changes: [], hours: 0, versions: [], history: [{ d: iso(TODAY), t: 'Projeto criado' }] };
    DB.projects.push(np); toast('Projeto criado com o checklist do serviço'); setTimeout(() => HASH.v = '#/projetos/p/' + np.id, 30);
  } });
}

/* drag & drop dos quadros */
function enableBoards() {
  document.querySelectorAll('.kanban').forEach(board => {
    const type = board.dataset.board; let dragId = null;
    board.querySelectorAll('.kcard').forEach(c => {
      c.addEventListener('dragstart', e => { dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      c.addEventListener('dragend', () => c.classList.remove('dragging'));
    });
    board.querySelectorAll('.col').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', e => {
        e.preventDefault(); col.classList.remove('over'); if (!dragId) return; const to = col.dataset.col;
        if (type === 'projects') moveProject(dragId, to);
        if (type === 'leads') { const l = DB.leads.find(x => x.id === dragId); const was = l.stage; l.stage = to; save(); route(); if (to === 'Fechado' && was !== 'Fechado') convertLead(l.id); }
      });
    });
  });
}
