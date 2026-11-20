/* ==========================================================
   Fase 2 e 3 — Aprovações, Contratos, Financeiro
   ========================================================== */

/* ============ 5. APROVAÇÕES ============ */
function approvalDays(a) { return -daysFromToday(a.sentAt); }
function approvalRow(a) {
  const d = approvalDays(a);
  const cnt = a.status === 'aguardando' ? `<span class="pill ${d >= 4 ? 'danger' : d >= 2 ? 'yellow' : ''}">${d === 0 ? 'enviado hoje' : d + (d === 1 ? ' dia' : ' dias')}</span>` : a.status === 'aprovado' ? pill('Aprovado', 'ok') : pill('Com alterações', 'pink');
  return `<div class="row clickable" onclick="openPublic('${a.id}')">${artThumb(a, 44)}<div class="grow"><div class="title">${esc(a.title)}</div><div class="sub">${esc(clientName(a.clientId))} · ${a.version} · enviado ${fmtDate(a.sentAt)}${a.respondedAt ? ' · respondido ' + esc(a.respondedAt) : ''}</div></div>${cnt}</div>`;
}
const artThumb = (a, s) => `<div style="width:${s}px;height:${s * 1.25}px;border-radius:10px;background:${a.art.bg};color:${a.art.fg};display:grid;place-items:center;font-family:var(--f-title);font-weight:800;font-size:${s / 5}px;text-align:center;line-height:1;flex:none;padding:3px;overflow:hidden">${esc(a.art.text.split('\n')[0])}</div>`;
PAGES.aprovacoes = (sub) => {
  sub = sub || 'aguardando';
  const head = pageHead('Aprovações', 'O cliente recebe um link, vê a peça e responde com um clique. Tudo fica registrado.', `<button class="btn primary" onclick="formApproval()">${icon('send')} Enviar peça</button>`);
  const tabs = subTabs('aprovacoes', NAV[4].subs, sub);
  const grid = list => list.length ? `<div class="grid g3">${list.map(a => { const d = approvalDays(a); return `<div class="card hover" style="padding:0;overflow:hidden;cursor:pointer" onclick="openPublic('${a.id}')">
      <div style="height:180px;background:${a.art.bg};color:${a.art.fg};display:grid;place-items:center;font-family:var(--f-title);font-weight:800;font-size:26px;text-align:center;white-space:pre-line;line-height:1.05;position:relative">${esc(a.art.text)}<span class="pill dark nodot" style="position:absolute;top:10px;left:10px">${a.version}</span>${a.kind !== 'imagem' ? `<span class="pill nodot" style="position:absolute;top:10px;right:10px">${a.kind}</span>` : ''}</div>
      <div style="padding:14px 16px;display:flex;flex-direction:column;gap:8px"><b>${esc(a.title)}</b><div class="small muted">${esc(clientName(a.clientId))}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">${a.status === 'aguardando' ? `<span class="pill ${d >= 4 ? 'danger' : d >= 2 ? 'yellow' : ''}">${icon('clock').replace('<svg', '<svg style="width:12px"')} ${d} ${d === 1 ? 'dia' : 'dias'} sem resposta</span><button class="btn sm" onclick="event.stopPropagation();remindApproval('${a.id}')">${icon('whats')} Lembrar</button>` : a.status === 'aprovado' ? `<span class="pill ok">Aprovado ${esc(a.respondedAt || '')}</span>` : `<span class="pill pink">${a.comments.length} comentário${a.comments.length === 1 ? '' : 's'}</span><button class="btn sm" onclick="event.stopPropagation();newVersion('${a.id}')">${icon('refresh')} Enviar V${parseInt(a.version.slice(1)) + 1}</button>`}</div></div></div>`; }).join('')}</div>` : empty('Nada por aqui.', 'checkCircle');
  if (sub === 'alteracoes') { const l = DB.approvals.filter(a => a.status === 'alteracao'); return head + tabs + `<p class="muted" style="margin-top:0">Os pedidos já entram automaticamente na ficha do projeto.</p>` + grid(l); }
  if (sub === 'aprovados') { const l = DB.approvals.filter(a => a.status === 'aprovado'); return head + tabs + `<div class="card table-wrap"><table class="table"><thead><tr><th>Peça</th><th>Cliente</th><th>Versão</th><th>Aprovado em</th><th></th></tr></thead><tbody>${l.map(a => `<tr><td><b>${esc(a.title)}</b></td><td>${esc(clientName(a.clientId))}</td><td>${a.version}</td><td>${pill(a.respondedAt || '—', 'ok')}</td><td class="right"><button class="btn sm" onclick="openPublic('${a.id}')">${icon('eye')} Comprovante</button></td></tr>`).join('') || `<tr><td colspan="5">${empty('Nenhuma peça aprovada ainda.')}</td></tr>`}</tbody></table></div>`; }
  if (sub === 'links') return head + tabs + `<div class="card table-wrap"><table class="table"><thead><tr><th>Link</th><th>Peça</th><th>Status</th><th class="right">Ações</th></tr></thead><tbody>${DB.approvals.map(a => `<tr style="${a.active ? '' : 'opacity:.5'}"><td class="small"><code>studiosun.app/a/${a.id}</code></td><td>${esc(a.title)}<div class="small muted">${esc(clientName(a.clientId))}</div></td><td>${a.active ? pill('Ativo', 'ok') : pill('Desativado')}</td><td class="right"><div class="actions" style="justify-content:flex-end"><button class="btn sm" onclick="copyText('https://studiosun.app/a/${a.id}','Link copiado')">${icon('copy')}</button><button class="btn sm" onclick="remindApproval('${a.id}')">${icon('send')} Reenviar</button><button class="btn sm" onclick="const a=DB.approvals.find(x=>x.id==='${a.id}');a.active=!a.active;save();route()">${a.active ? 'Desativar' : 'Ativar'}</button></div></td></tr>`).join('')}</tbody></table></div>`;
  const l = DB.approvals.filter(a => a.status === 'aguardando' && a.active).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  return head + tabs + `<div class="legend" style="margin-bottom:14px"><span class="pill yellow">a partir de 2 dias</span><span class="pill danger">a partir de 4 dias</span></div>` + grid(l);
};
function remindApproval(id) {
  const a = DB.approvals.find(x => x.id === id), c = client(a.clientId);
  const msg = fillVars(DB.messages.find(m => m.id === 'm4').text, { nome: c.name.split(' ')[0], link: `https://studiosun.app/a/${a.id}` });
  copyText(msg, 'Lembrete copiado — cole no WhatsApp do cliente');
}
function newVersion(id) {
  const a = DB.approvals.find(x => x.id === id); const n = parseInt(a.version.slice(1)) + 1;
  const na = { ...a, id: uid('a'), version: 'V' + n, status: 'aguardando', sentAt: iso(TODAY), comments: [], respondedAt: null, title: a.title.replace(/ — V\d+$/, '') + ' — V' + n };
  a.active = false; DB.approvals.push(na);
  const p = project(a.projectId); if (p) { p.versions.push('V' + n); p.history.push({ d: iso(TODAY), t: `V${n} enviada para aprovação` }); p.stage = 'Em aprovação'; }
  save(); route(); toast(`V${n} enviada — a anterior fica guardada`);
}
function formApproval(pid) {
  const pr = pid ? project(pid) : null;
  openForm({ title: 'Enviar para aprovação', fields: [
    { k: 'projectId', label: 'Projeto', type: 'select', options: DB.projects.filter(p => p.stage !== 'Entregue').map(p => [p.id, p.title + ' · ' + clientName(p.clientId)]), value: pid, full: true },
    { k: 'title', label: 'Nome da peça', value: pr ? pr.title : '', full: true, required: true },
    { k: 'kind', label: 'Tipo', type: 'select', options: [['imagem', 'Imagem'], ['carrossel', 'Carrossel'], ['video', 'Vídeo']] },
    { k: 'text', label: 'Texto da arte (prévia)', value: 'nova\npeça' },
    { k: 'caption', label: 'Legenda do post', type: 'textarea', full: true },
  ], submit: 'Gerar link', onSubmit: v => {
    const p = project(v.projectId), pal = client(p.clientId).identity.palette;
    const prevV = DB.approvals.filter(a => a.projectId === p.id).length;
    const a = { id: uid('a'), projectId: p.id, clientId: p.clientId, title: v.title, kind: v.kind, caption: v.caption, sentAt: iso(TODAY), status: 'aguardando', version: 'V' + (prevV + 1), comments: [], active: true, art: { bg: pal[0]?.hex || '#FF5C90', fg: (pal.find(x => x.role === 'fundo') || pal[1] || { hex: '#fff' }).hex, text: v.text.replace(/\\n/g, '\n'), slides: v.kind === 'carrossel' ? 4 : 0 } };
    DB.approvals.push(a); p.stage = 'Em aprovação'; p.history.push({ d: iso(TODAY), t: `${a.version} enviada para aprovação` });
    copyText(`https://studiosun.app/a/${a.id}`, 'Link de aprovação gerado e copiado');
    setTimeout(() => openPublic(a.id), 200);
  } });
}

/* Página pública do cliente (simulação do link, sem login) */
UI.slide = 0; UI.pins = [];
function openPublic(id) {
  const a = DB.approvals.find(x => x.id === id), c = client(a.clientId); UI.pubId = id; UI.pins = []; UI.slide = UI.slide || 0;
  const th = UI.pubBrand ? clientTheme(c) : null;
  const slides = a.art.slides || 1;
  const el = document.createElement('div'); el.className = 'public'; el.id = 'public';
  if (th) el.style.background = mix(th.bg, '#ffffff', .2);
  el.innerHTML = `<div class="public-top" style="${th ? `background:${th.primary};color:${inkOn(th.primary)}` : ''}">
      ${th ? clientLogo(c.id, 38) : '<div class="logo-fx dark" style="width:64px"></div>'}
      <div><b style="font-family:var(--f-title)">${th ? esc(c.brand) : 'Studio Sun'}</b><div class="small" style="opacity:.75">Aprovação para ${esc(c.brand)}</div></div>
      <span class="spacer" style="flex:1"></span>
      <label class="small" style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" ${UI.pubBrand ? 'checked' : ''} onchange="UI.pubBrand=this.checked;closePublic();openPublic('${id}')"> Cara da marca do cliente</label>
      <button class="btn sm" onclick="closePublic()">${icon('x')} Fechar prévia</button></div>
    <div class="public-body">
      <div class="small muted" style="text-align:center;margin-bottom:6px">Você está vendo o que o cliente vê · link público, sem login</div>
      <h1 style="text-align:center;margin-bottom:6px">${esc(a.title)}</h1><p class="muted" style="text-align:center;margin:0 0 20px">${a.version} · enviado em ${fmtDate(a.sentAt)}</p>
      <div class="piece" id="piece" style="background:${a.art.bg};color:${a.art.fg}" onclick="addPin(event)">
        <div class="art" style="white-space:pre-line">${esc(a.art.text)}${slides > 1 ? `<div style="font-size:14px;opacity:.7;margin-top:12px">${UI.slide + 1} / ${slides}</div>` : ''}</div>
        ${a.kind === 'video' ? `<div style="position:absolute;inset:auto auto 18px 18px" class="pill dark nodot">${icon('play').replace('<svg', '<svg style="width:12px"')} 0:15</div>` : ''}
        ${slides > 1 ? `<button class="carousel-nav" style="left:12px" onclick="event.stopPropagation();UI.slide=Math.max(0,UI.slide-1);closePublic();openPublic('${id}')">${icon('chevL')}</button><button class="carousel-nav" style="right:12px" onclick="event.stopPropagation();UI.slide=Math.min(${slides - 1},UI.slide+1);closePublic();openPublic('${id}')">${icon('chev')}</button>` : ''}
        ${a.comments.filter(x => x.x != null).map((cm, i) => `<span class="pin" style="left:${cm.x}%;top:${cm.y}%" title="${esc(cm.t)}">${i + 1}</span>`).join('')}
        <div id="new-pins"></div>
      </div>
      ${a.caption ? `<div class="card" style="margin-top:18px"><div class="small muted" style="margin-bottom:4px">Legenda</div>${esc(a.caption)}</div>` : ''}
      ${a.status === 'aguardando' && a.active ? `<div class="big-actions"><button class="btn ok lg" onclick="approve('${id}')">${icon('check')} Aprovar</button><button class="btn primary lg" onclick="document.getElementById('change-box').classList.remove('hidden');this.scrollIntoView({behavior:'smooth'})">${icon('edit')} Pedir alteração</button></div>
        <div class="card hidden" id="change-box"><h3 style="margin-bottom:8px">O que você quer mudar?</h3><p class="small muted" style="margin-top:0">Dica: clique num ponto da imagem para marcar onde mudar.</p><textarea id="change-text" class="field-inline" style="width:100%;border-radius:12px;min-height:90px" placeholder="Escreva aqui…"></textarea><div style="text-align:right;margin-top:10px"><button class="btn primary" onclick="requestChange('${id}')">${icon('send')} Enviar pedido</button></div></div>`
      : `<div class="card" style="margin-top:20px;text-align:center">${a.status === 'aprovado' ? `<span class="pill ok" style="font-size:14px;padding:8px 16px">✓ Aprovado em ${esc(a.respondedAt)}</span><p class="small muted">Este registro serve como comprovante de aprovação.</p>` : `<span class="pill pink" style="font-size:14px;padding:8px 16px">Alteração pedida</span><div class="list" style="text-align:left;margin-top:12px">${a.comments.map((cm, i) => `<div class="row"><span class="pin" style="position:static;transform:none;width:24px;height:24px">${i + 1}</span><div class="grow">${esc(cm.t)}</div></div>`).join('')}</div>`}</div>`}
      ${batchSection(a)}
    </div>`;
  document.body.appendChild(el);
}
function batchSection(a) {
  const posts = DB.posts.filter(p => p.clientId === a.clientId && ym(p.date) === curYM);
  if (posts.length < 2) return '';
  return `<div class="card" style="margin-top:24px"><div class="card-head"><h2>Modo lote · calendário do mês</h2><span class="small muted">aprove post por post</span></div><div class="list">${posts.map(p => `<div class="row"><span class="pill nodot">${fmtDate(p.date)}</span><span class="post-tag ${p.format}" style="cursor:default">${p.format}</span><div class="grow">${esc(p.title)}</div>${p.status === 'aprovado' || p.status === 'publicado' ? pill(p.status, 'ok') : `<button class="btn ok sm" onclick="const p=DB.posts.find(x=>x.id==='${p.id}');p.status='aprovado';save();closePublic();openPublic('${a.id}')">${icon('check')} Aprovar</button>`}</div>`).join('')}</div></div>`;
}
function closePublic() { document.getElementById('public')?.remove(); }
function addPin(e) {
  if (!document.getElementById('change-box')) return;
  const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
  UI.pins.push({ x, y }); const a = DB.approvals.find(z => z.id === UI.pubId);
  document.getElementById('new-pins').insertAdjacentHTML('beforeend', `<span class="pin" style="left:${x}%;top:${y}%">${a.comments.length + UI.pins.length}</span>`);
  document.getElementById('change-box').classList.remove('hidden');
}
function approve(id) {
  const a = DB.approvals.find(x => x.id === id); const now = new Date();
  a.status = 'aprovado'; a.respondedAt = `${fmtDate(iso(now))} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const p = project(a.projectId); if (p) { p.stage = 'Finalizado'; p.history.push({ d: iso(TODAY), t: `${a.version} aprovada pelo cliente` }); const st = p.checklist.find(c => /aprova/i.test(c.t)); if (st) st.done = true; }
  DB.posts.filter(po => po.clientId === a.clientId && po.title && a.title.toLowerCase().includes(po.title.toLowerCase().slice(0, 8))).forEach(po => po.status = 'aprovado');
  save(); closePublic(); confetti(); toast('Aprovado! O projeto andou sozinho para “Finalizado”'); route();
}
function requestChange(id) {
  const a = DB.approvals.find(x => x.id === id); const t = document.getElementById('change-text').value.trim();
  if (!t && !UI.pins.length) return toast('Escreva o que mudar ou marque um ponto', 'alert');
  if (UI.pins.length) UI.pins.forEach((pp, i) => a.comments.push({ t: t + (UI.pins.length > 1 ? ` (ponto ${i + 1})` : ''), x: pp.x, y: pp.y }));
  else a.comments.push({ t });
  a.status = 'alteracao'; a.respondedAt = fmtDate(iso(TODAY));
  const p = project(a.projectId); if (p) { p.changes.push({ t: t || 'Ver pontos marcados na peça', done: false }); p.changesUsed++; p.stage = 'Ajustes'; p.history.push({ d: iso(TODAY), t: 'Cliente pediu alteração' }); }
  save(); closePublic(); toast('Pedido registrado e enviado para a ficha do projeto'); route();
}

/* ============ 6. CONTRATOS ============ */
function contractVars(k) {
  const c = client(k.clientId) || {}, s = service(k.serviceId) || {};
  return { cliente: c.name ? `${c.name} (${c.brand})` : '{cliente}', 'CPF/CNPJ': c.doc || '{CPF/CNPJ}', 'serviço': s.name, inclui: s.includes, valor: brl2(k.value), 'forma de pagamento': k.payment || s.payment, prazo: k.deadline || s.deadline, 'alterações inclusas': k.changes ?? s.changes, data: fmtDateLong(k.created || iso(TODAY)), estudio: DB.studio.name, cnpj_estudio: DB.studio.cnpj, pix: DB.studio.pix, multa: DB.studio.multa, cidade: DB.studio.city };
}
const contractText = k => fillVars(DB.contractModel, contractVars(k));
function contractDoc(k, highlight = true) {
  let t = esc(DB.contractModel); const v = contractVars(k);
  t = t.replace(/\{([^}]+)\}/g, (m, key) => highlight ? `<mark>${esc(v[key] ?? m)}</mark>` : esc(v[key] ?? m));
  return `<div class="doc"><div class="doc-head"><div class="logo-fx dark" style="width:74px"></div><div class="small" style="text-align:right;color:#777">${esc(DB.studio.name)}<br>${esc(DB.studio.email)}</div></div>${t}${k.acceptedAt ? `\n\n<b style="color:#3DBE7A">✓ Li e aceito — ${esc(k.acceptedAt)}</b>` : ''}</div>`;
}
PAGES.contratos = (sub, id) => {
  if (sub === 'k' && id) return contractPage(id);
  sub = sub || 'enviados';
  const head = pageHead('Contratos', 'Gere um contrato pronto em menos de um minuto: escolha cliente e serviço, o resto se preenche.', `<a class="btn primary" href="#/contratos/gerar">${icon('plus')} Gerar contrato</a>`);
  const tabs = subTabs('contratos', NAV[5].subs, sub);
  if (sub === 'modelos') return head + tabs + `<div class="grid g3"><div class="card span2"><div class="card-head"><h2>Modelo padrão</h2><button class="btn primary sm" onclick="saveModel()">Salvar modelo</button></div><textarea id="model-text" class="field-inline" style="width:100%;min-height:460px;border-radius:14px;font-family:ui-monospace,monospace;font-size:12.5px;line-height:1.6">${esc(DB.contractModel)}</textarea></div>
    <div class="card"><h2 style="margin-bottom:10px">Campos automáticos</h2><p class="small muted" style="margin-top:0">Clique para copiar e cole no texto.</p><div class="chips">${['{cliente}', '{CPF/CNPJ}', '{serviço}', '{inclui}', '{valor}', '{forma de pagamento}', '{prazo}', '{alterações inclusas}', '{data}', '{pix}', '{multa}', '{cidade}', '{estudio}', '{cnpj_estudio}'].map(f => `<span class="chip" onclick="copyText('${f}','Campo copiado')">${f}</span>`).join('')}</div>
    <p class="small muted">Um modelo serve a todos os serviços: o texto do serviço, valor, prazo e alterações vêm do catálogo.</p></div></div>`;
  if (sub === 'gerar') return head + tabs + generator();
  if (sub === 'mensagens') return head + tabs + messagesView();
  return head + tabs + `<div class="card table-wrap"><table class="table"><thead><tr><th>Cliente</th><th>Serviço</th><th>Status</th><th>Criado</th><th>Aceite</th><th class="right">Valor</th></tr></thead><tbody>${[...DB.contracts].reverse().map(k => `<tr class="clickable" onclick="HASH.v='#/contratos/k/${k.id}'"><td><div style="display:flex;gap:8px;align-items:center">${clientLogo(k.clientId, 28)}<b>${esc(clientName(k.clientId))}</b></div></td><td>${esc(service(k.serviceId)?.name)}</td><td>${pill(k.status)}</td><td>${fmtDate(k.created)}</td><td class="small">${k.acceptedAt ? esc(k.acceptedAt) : '—'}</td><td class="right num">${brl(k.value)}</td></tr>`).join('')}</tbody></table></div>`;
};
function saveModel() { DB.contractModel = document.getElementById('model-text').value; save(); toast('Modelo salvo'); }
function generator() {
  const d = UI.draftContract = UI.draftContract || {}; const s = d.serviceId ? service(d.serviceId) : null;
  if (s && d.value == null) { d.value = s.price || 0; d.deadline = s.deadline; d.payment = s.payment; d.changes = s.changes; }
  const step = !d.clientId ? 1 : !d.serviceId ? 2 : 3;
  const steps = ['Cliente', 'Serviço', 'Ajustes', 'Visualizar', 'Enviar'];
  return `<div class="stepper">${steps.map((t, i) => `<div class="s ${i + 1 < step ? 'done' : i + 1 === step || (step === 3 && i >= 2) ? 'on' : ''}"><b>${i + 1 < step ? '✓' : i + 1}</b>${t}</div>`).join('')}</div>
  <div class="grid g2"><div class="card"><div class="form">
    <div class="f full"><label>1. Cliente</label><div style="display:flex;gap:6px"><select onchange="UI.draftContract.clientId=this.value;route()" style="flex:1"><option value="">Escolha…</option>${DB.clients.filter(c => c.status !== 'Encerrado').map(c => `<option value="${c.id}" ${d.clientId === c.id ? 'selected' : ''}>${esc(c.brand)} · ${esc(c.name)}</option>`).join('')}</select><button class="btn sm" onclick="formClient()" title="Cadastrar na hora">${icon('plus')}</button></div></div>
    <div class="f full"><label>2. Serviço ou pacote</label><select onchange="const s=service(this.value);Object.assign(UI.draftContract,{serviceId:this.value,value:s.price||0,deadline:s.deadline,payment:s.payment,changes:s.changes});route()"><option value="">Escolha…</option>${DB.services.map(x => `<option value="${x.id}" ${d.serviceId === x.id ? 'selected' : ''}>${esc(x.name)}${x.price ? ' · ' + brl(x.price) : ''}</option>`).join('')}</select></div>
    ${s ? `<div class="f"><label>3. Valor (R$)</label><input type="number" value="${d.value}" oninput="UI.draftContract.value=+this.value;updDoc()"></div>
    <div class="f"><label>Prazo</label><input value="${esc(d.deadline)}" oninput="UI.draftContract.deadline=this.value;updDoc()"></div>
    <div class="f"><label>Forma de pagamento</label><input value="${esc(d.payment)}" oninput="UI.draftContract.payment=this.value;updDoc()"></div>
    <div class="f"><label>Alterações inclusas</label><input type="number" value="${d.changes}" oninput="UI.draftContract.changes=+this.value;updDoc()"></div>
    <div class="f full"><label>Desconto rápido</label><div class="actions">${[0, 5, 10, 15].map(p => `<button class="btn sm" onclick="UI.draftContract.value=Math.round(${s.price || d.value}*(1-${p}/100));route()">${p ? '−' + p + '%' : 'Sem desconto'}</button>`).join('')}</div></div>` : ''}
  </div>
  ${s && d.clientId ? `<div style="border-top:1px solid var(--line);margin-top:18px;padding-top:16px"><label class="small muted" style="font-weight:600">5. Sair do jeito que precisar</label><div class="actions" style="margin-top:8px">
    <button class="btn" onclick="finishContract('pdf')">${icon('download')} Baixar PDF</button><button class="btn" onclick="finishContract('copy')">${icon('copy')} Copiar texto</button><button class="btn primary" onclick="finishContract('link')">${icon('link')} Enviar link de aceite</button></div></div>` : ''}
  </div>
  <div><div class="small muted" style="margin-bottom:8px;font-weight:600">4. Visualização · com a identidade do estúdio</div><div id="doc-prev">${d.clientId && d.serviceId ? contractDoc({ ...d, created: iso(TODAY) }) : `<div class="card">${empty('Escolha cliente e serviço para ver o contrato pronto.', 'file')}</div>`}</div></div></div>`;
}
function updDoc() { const d = UI.draftContract; document.getElementById('doc-prev').innerHTML = contractDoc({ ...d, created: iso(TODAY) }); }
function finishContract(how) {
  const d = UI.draftContract; const k = { id: uid('k'), clientId: d.clientId, serviceId: d.serviceId, value: d.value, deadline: d.deadline, payment: d.payment, changes: d.changes, created: iso(TODAY), status: how === 'link' ? 'Enviado' : 'Rascunho' };
  DB.contracts.push(k); UI.draftContract = null; save();
  if (how === 'copy') copyText(contractText(k), 'Contrato copiado — cole no WhatsApp');
  if (how === 'link') copyText(`https://studiosun.app/contrato/${k.id}`, 'Link de aceite copiado');
  if (how === 'pdf') printContract(k.id);
  HASH.v = '#/contratos/k/' + k.id;
}
function printContract(id) {
  const k = DB.contracts.find(x => x.id === id); const w = window.open('', '_blank'); if (!w) return toast('Não deu para abrir a janela do PDF aqui. Abra o Núcleo direto no navegador do computador para gerar o PDF.', 'alert');
  w.document.write(`<!doctype html><html><head><title>Contrato · ${esc(clientName(k.clientId))}</title><style>body{font-family:Inter,system-ui,sans-serif;margin:50px;color:#2c2c2c;line-height:1.7;font-size:13px;white-space:pre-wrap}.h{border-bottom:3px solid #FF5C90;padding-bottom:12px;margin-bottom:20px;white-space:normal;font-family:Sora,sans-serif;font-weight:700;font-size:20px}</style></head><body><div class="h">Studio Sun</div>${esc(contractText(k))}${k.acceptedAt ? '\n\n✓ Li e aceito — ' + esc(k.acceptedAt) : ''}<script>setTimeout(()=>print(),400)<\/script></body></html>`); w.document.close();
}
function contractPage(id) {
  const k = DB.contracts.find(x => x.id === id); if (!k) return empty('Contrato não encontrado.');
  return pageHead(`Contrato · ${esc(clientName(k.clientId))}`, `${esc(service(k.serviceId)?.name)} · ${brl(k.value)} · ${pill(k.status)}`, `<button class="btn" onclick="printContract('${k.id}')">${icon('download')} PDF</button><button class="btn" onclick="copyText(contractText(DB.contracts.find(x=>x.id==='${k.id}')),'Contrato copiado')">${icon('copy')} Copiar texto</button>${k.status !== 'Aceito' ? `<button class="btn" onclick="copyText('https://studiosun.app/contrato/${k.id}','Link de aceite copiado');const k=DB.contracts.find(x=>x.id==='${k.id}');k.status='Enviado';save();route()">${icon('link')} Link de aceite</button><button class="btn primary" onclick="acceptContract('${k.id}')">${icon('check')} Simular “Li e aceito”</button>` : ''}`, `<a href="#/contratos/enviados">Contratos</a> › ${esc(clientName(k.clientId))}`)
    + `<div class="grid g3"><div class="span2">${contractDoc(k, false)}</div><div class="card" style="align-self:start"><h2 style="margin-bottom:12px">Status</h2><div class="list">${['Rascunho', 'Enviado', 'Aceito', 'Vencido'].map(s => `<div class="row"><span class="grow">${pill(s)}</span>${k.status === s ? '<b>atual</b>' : `<button class="btn ghost sm" onclick="DB.contracts.find(x=>x.id==='${k.id}').status='${s}';save();route()">marcar</button>`}</div>`).join('')}</div>
    <p class="small muted">Contrato aceito fica ligado à ficha do cliente e ao projeto.</p><a class="btn sm" href="#/clientes/c/${k.clientId}">${icon('users')} Ficha do cliente</a></div></div>`;
}
function acceptContract(id) {
  const k = DB.contracts.find(x => x.id === id), now = new Date(); k.status = 'Aceito'; k.acceptedAt = `${fmtDate(iso(now))} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const s = service(k.serviceId); const ent = Math.round(k.value * (DB.studio.entrada / 100));
  if (!s.monthly && !DB.receivables.find(r => r.contractId === k.id)) {
    DB.receivables.push({ id: uid('r'), contractId: k.id, clientId: k.clientId, desc: `${s.name} — entrada`, value: ent, due: iso(TODAY), paid: false });
    DB.receivables.push({ id: uid('r'), contractId: k.id, clientId: k.clientId, desc: `${s.name} — quitação`, value: k.value - ent, due: rel(15), paid: false });
  }
  if (!DB.projects.find(p => p.contractId === k.id)) DB.projects.push({ id: uid('p'), contractId: k.id, clientId: k.clientId, serviceId: k.serviceId, title: `${s.name} · ${clientName(k.clientId)}`, stage: 'Briefing', due: rel(15), value: k.value, changesUsed: 0, changesIncluded: k.changes ?? s.changes, checklist: s.process.map(t => ({ t, done: false })), changes: [], hours: 0, versions: [], history: [{ d: iso(TODAY), t: 'Projeto criado a partir do contrato aceito' }] });
  save(); confetti(); toast('Contrato aceito! Projeto criado e parcelas lançadas em A receber'); route();
}
function messagesView() {
  const c = UI.msgClient ? client(UI.msgClient) : null;
  const vars = c ? { nome: c.name.split(' ')[0], valor: brl(c.value), data: fmtDate(rel(5)), pix: DB.studio.pix, 'serviço': service(c.service)?.name, prazo: service(c.service)?.deadline, forma: service(c.service)?.payment, link: 'https://studiosun.app/…' } : { pix: DB.studio.pix };
  return `<div class="toolbar"><span class="muted">Preencher com os dados de:</span><select class="field-inline" onchange="UI.msgClient=this.value;route()"><option value="">— nenhum cliente —</option>${clientOpts().map(([v, l]) => `<option value="${v}" ${UI.msgClient === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select><span class="grow"></span><button class="btn sm" onclick="formMessage()">${icon('plus')} Nova mensagem</button></div>
  <div class="grid g3">${DB.messages.map(m => { const t = fillVars(m.text, vars); return `<div class="card hover" style="display:flex;flex-direction:column;gap:10px"><div class="card-head" style="margin:0"><h3>${esc(m.name)}</h3><button class="btn ghost sm" onclick="formMessage('${m.id}')">${icon('edit')}</button></div><p class="small" style="margin:0;white-space:pre-wrap;color:var(--muted);flex:1">${esc(t).replace(/\{([^}]+)\}/g, '<mark style="background:var(--yellow);border-radius:4px;padding:0 3px">{$1}</mark>')}</p><div class="actions"><button class="btn primary sm" onclick="copyText(${esc(JSON.stringify(t))})">${icon('copy')} Copiar</button>${c ? `<a class="btn sm" target="_blank" rel="noopener" href="${waLink(c.whatsapp, t)}">${icon('whats')} Abrir no WhatsApp</a>` : ''}</div></div>`; }).join('')}</div>`;
}
function formMessage(id) { const m = id ? DB.messages.find(x => x.id === id) : {}; openForm({ title: id ? 'Editar mensagem' : 'Nova mensagem', fields: [{ k: 'name', label: 'Nome', value: m.name, full: true, required: true }, { k: 'text', label: 'Texto (campos: {nome} {valor} {data} {pix} {link} {serviço})', type: 'textarea', value: m.text, full: true }], onSubmit: v => { if (id) Object.assign(m, v); else DB.messages.push({ ...v, id: uid('m') }); } }); }

/* ============ 7. FINANCEIRO ============ */
function receivableRow(r) {
  const n = daysFromToday(r.due), late = n < 0;
  return `<div class="row"><div class="grow"><div class="title">${esc(r.desc)}</div><div class="sub">${esc(clientName(r.clientId))} · vence ${fmtDate(r.due)} (${countdown(n)})</div></div>${late ? pill('Atrasado', 'danger') : n <= 7 ? pill('Esta semana', 'yellow') : ''}<b class="num">${brl(r.value)}</b><button class="btn sm" onclick="chargeMsg('${r.id}')" title="Gerar cobrança">${icon('copy')} Cobrança</button><button class="btn ok sm" onclick="markPaid('${r.id}')">${icon('check')} Pago</button></div>`;
}
function chargeMsg(id) {
  const r = DB.receivables.find(x => x.id === id), c = client(r.clientId); const late = daysFromToday(r.due) < 0;
  copyText(fillVars(DB.messages.find(m => m.id === (late ? 'm6' : 'm5')).text, { nome: c.name.split(' ')[0], valor: brl2(r.value), data: fmtDate(r.due), pix: DB.studio.pix }), 'Cobrança copiada com nome, valor e chave Pix');
}
function markPaid(id) {
  const r = DB.receivables.find(x => x.id === id); r.paid = true;
  DB.payments.push({ id: uid('pg'), clientId: r.clientId, projectId: r.projectId, value: r.value, date: iso(TODAY), method: 'Pix', type: /entrada/i.test(r.desc) ? 'entrada' : /mensal/i.test(r.desc) ? 'mensalidade' : 'parcela' });
  save(); toast(`${brl(r.value)} recebido de ${clientName(r.clientId)} 💸`); checkGoal(); route();
}
function checkGoal() { if (paidIn(curYM) >= DB.goals.month && DB.celebrated !== curYM) { DB.celebrated = curYM; save(); confetti(); toast('Meta do mês batida! 🎉', 'star'); } }
function formPayment(pre = {}) {
  openForm({ title: 'Registrar recebimento', fields: [
    { k: 'clientId', label: 'Cliente', type: 'select', options: clientOpts(), value: pre.clientId }, { k: 'projectId', label: 'Projeto', type: 'select', options: [['', '—'], ...DB.projects.map(p => [p.id, p.title])] },
    { k: 'value', label: 'Valor (R$)', type: 'number', required: true }, { k: 'date', label: 'Data', type: 'date', value: iso(TODAY) },
    { k: 'method', label: 'Forma', type: 'select', options: ['Pix', 'Cartão', 'Transferência', 'Dinheiro'] }, { k: 'type', label: 'Tipo', type: 'select', options: ['entrada', 'parcela', 'mensalidade', 'quitação'] },
    { k: 'proof', label: 'Comprovante (opcional)', type: 'file', full: true },
  ], onSubmit: v => { delete v.proof; DB.payments.push({ ...v, id: uid('pg') }); toast('Recebimento registrado'); setTimeout(checkGoal, 100); } });
}
PAGES.financeiro = (sub) => {
  sub = sub || 'recebimentos';
  const head = pageHead('Financeiro', 'Quanto entra, quanto sai e quanto cada serviço realmente dá de lucro.', `<button class="btn primary" onclick="formPayment()">${icon('plus')} Recebimento</button>`);
  const tabs = subTabs('financeiro', NAV[6].subs, sub);
  if (sub === 'receber') {
    const open = openReceivables().sort((a, b) => a.due.localeCompare(b.due));
    const late = open.filter(r => daysFromToday(r.due) < 0), week = open.filter(r => { const n = daysFromToday(r.due); return n >= 0 && n <= 7; }), month = open.filter(r => { const n = daysFromToday(r.due); return n > 7 && ym(r.due) === curYM; }), later = open.filter(r => daysFromToday(r.due) > 7 && ym(r.due) !== curYM);
    const sec = (t, l, cls) => `<div class="card" style="margin-bottom:16px"><div class="card-head"><h2>${t}</h2><span class="pill ${cls}">${brl(l.reduce((s, r) => s + r.value, 0))}</span></div><div class="list">${l.map(receivableRow).join('') || '<p class="small muted" style="margin:0">Nada aqui.</p>'}</div></div>`;
    return head + tabs + sec('Atrasado', late, 'danger') + sec('Vence esta semana', week, 'yellow') + sec('Vence este mês', month, '') + sec('Próximos meses', later, '') + `<button class="btn" onclick="formReceivable()">${icon('plus')} Lançar parcela</button>`;
  }
  if (sub === 'custos') {
    const fixed = DB.costs.filter(c => c.kind === 'fixo'), vari = DB.costs.filter(c => c.kind === 'variavel');
    return head + tabs + `<div class="grid g2"><div class="card"><div class="card-head"><h2>Fixos mensais</h2><span class="pill dark nodot">${brl(fixed.reduce((s, c) => s + c.value, 0))}/mês</span></div><div class="list">${fixed.map(c => `<div class="row"><div class="grow title">${esc(c.name)}</div><b class="num">${brl(c.value)}</b><button class="btn ghost sm" onclick="delCost('${c.id}')">${icon('trash')}</button></div>`).join('')}</div><button class="btn sm" style="margin-top:10px" onclick="formCost('fixo')">${icon('plus')} Custo fixo</button></div>
      <div class="card"><div class="card-head"><h2>Variáveis por projeto</h2><span class="pill nodot">${brl(vari.reduce((s, c) => s + c.value, 0))}</span></div><div class="list">${vari.map(c => `<div class="row"><div class="grow"><div class="title">${esc(c.name)}</div><div class="sub">${esc(project(c.projectId)?.title || '—')} · ${fmtDate(c.date)}</div></div><b class="num">${brl(c.value)}</b><button class="btn ghost sm" onclick="delCost('${c.id}')">${icon('trash')}</button></div>`).join('')}</div><button class="btn sm" style="margin-top:10px" onclick="formCost('variavel')">${icon('plus')} Custo do projeto</button></div></div>`;
  }
  if (sub === 'precificacao') {
    const pr = DB.pricing, fixed = DB.costs.filter(c => c.kind === 'fixo').reduce((s, c) => s + c.value, 0), hr = hourRate();
    return head + tabs + `<div class="grid g3"><div class="card"><h2 style="margin-bottom:14px">1. Seu valor-hora</h2><div class="form" style="grid-template-columns:1fr">
      <div class="f"><label>Quanto quero ganhar por mês</label><input type="number" value="${pr.desired}" onchange="DB.pricing.desired=+this.value;save();route()"></div>
      <div class="f"><label>Custos fixos (de Custos e despesas)</label><input value="${brl(fixed)}" disabled></div>
      <div class="f"><label>Horas produtivas no mês</label><input type="number" value="${pr.hoursMonth}" onchange="DB.pricing.hoursMonth=+this.value;save();route()"></div>
      <div class="f"><label>Margem (%)</label><input type="number" value="${pr.margin}" onchange="DB.pricing.margin=+this.value;save();route()"></div>
      <div class="f"><label>Impostos (%)</label><input type="number" value="${pr.tax}" onchange="DB.pricing.tax=+this.value;save();route()"></div></div>
      <div class="card soft" style="margin-top:16px;text-align:center"><div class="small muted">Seu valor-hora</div><div style="font-family:var(--f-title);font-size:36px;font-weight:700;color:var(--pink)">${brl2(hr)}</div></div></div>
      <div class="card span2"><h2 style="margin-bottom:6px">2. Preço do serviço</h2><p class="small muted" style="margin-top:0">horas × valor-hora + custos + margem + impostos = preço sugerido</p><div class="table-wrap"><table class="table"><thead><tr><th>Serviço</th><th>Horas</th><th class="right">Atual</th><th class="right">Sugerido</th><th></th></tr></thead><tbody>
      ${DB.services.map(s => { const sug = suggestedPrice(s); const low = s.price && s.price < sug; return `<tr><td><b>${esc(s.name)}</b></td><td><input type="number" step="0.5" value="${s.hours}" class="field-inline" style="width:72px" onchange="service('${s.id}').hours=+this.value;save();route()"></td><td class="right num">${s.price ? brl(s.price) : '<span class="muted">a definir</span>'}${low ? `<div><span class="pill danger">abaixo</span></div>` : ''}</td><td class="right num"><b>${brl(sug)}</b></td><td class="right"><button class="btn sm ${low || !s.price ? 'primary' : ''}" onclick="service('${s.id}').price=${sug};save();route();toast('Preço atualizado no catálogo')">Usar no catálogo</button></td></tr>`; }).join('')}</tbody></table></div></div></div>`;
  }
  if (sub === 'metas') {
    const fat = paidIn(curYM), y = String(TODAY.getFullYear()); const fy = DB.payments.filter(p => p.date.startsWith(y)).reduce((s, p) => s + p.value, 0);
    const newC = DB.clients.filter(c => ym(c.since) === curYM).length;
    const bar = (t, v, g, f = brl) => { const p = Math.min(100, Math.round(v / g * 100)); return `<div class="card"><div class="card-head"><h2>${t}</h2><span class="pill ${p >= 100 ? 'ok' : 'yellow'}">${p}%</span></div><div style="font-family:var(--f-title);font-size:28px;font-weight:700;margin-bottom:10px">${f(v)} <span class="small muted" style="font-family:var(--f-text);font-weight:500">de ${f(g)}</span></div><div class="progress"><span style="width:${p}%"></span></div></div>`; };
    return head + tabs + `<div class="grid g3">${bar('Meta do mês', fat, DB.goals.month)}${bar('Meta do ano', fy, DB.goals.year)}${bar('Clientes novos no mês', newC, DB.goals.newClients, x => x)}</div>
    <div class="card" style="margin-top:18px;max-width:560px"><h2 style="margin-bottom:12px">Definir metas</h2><div class="form"><div class="f"><label>Meta do mês (R$)</label><input type="number" value="${DB.goals.month}" onchange="DB.goals.month=+this.value;save();route()"></div><div class="f"><label>Meta do ano (R$)</label><input type="number" value="${DB.goals.year}" onchange="DB.goals.year=+this.value;save();route()"></div><div class="f"><label>Clientes novos / mês</label><input type="number" value="${DB.goals.newClients}" onchange="DB.goals.newClients=+this.value;save();route()"></div></div></div>`;
  }
  const list = [...DB.payments].sort((a, b) => b.date.localeCompare(a.date));
  const fat = paidIn(curYM), cst = costsIn(curYM);
  return head + tabs + `<div class="grid g4 kpis" style="margin-bottom:18px"><div class="card kpi accent"><div class="label">Recebido no mês</div><div class="value">${brl(fat)}</div></div><div class="card kpi"><div class="label">Custos do mês</div><div class="value">${brl(cst)}</div></div><div class="card kpi"><div class="label">Lucro</div><div class="value" style="color:${fat - cst >= 0 ? 'var(--ok)' : 'var(--danger)'}">${brl(fat - cst)}</div></div><div class="card kpi"><div class="label">Margem</div><div class="value">${fat ? Math.round((fat - cst) / fat * 100) : 0}%</div></div></div>
  <div class="card table-wrap"><table class="table"><thead><tr><th>Data</th><th>Cliente</th><th>Projeto</th><th>Forma</th><th>Tipo</th><th class="right">Valor</th></tr></thead><tbody>${list.map(p => `<tr><td>${fmtDate(p.date)}</td><td>${esc(clientName(p.clientId))}</td><td class="small muted">${esc(project(p.projectId)?.title || '—')}</td><td>${p.method}</td><td>${pill(p.type, 'nodot')}</td><td class="right num"><b>${brl(p.value)}</b></td></tr>`).join('')}</tbody></table></div>`;
};
function formReceivable() { openForm({ title: 'Lançar parcela a receber', fields: [{ k: 'clientId', label: 'Cliente', type: 'select', options: clientOpts() }, { k: 'desc', label: 'Descrição', required: true }, { k: 'value', label: 'Valor', type: 'number', required: true }, { k: 'due', label: 'Vencimento', type: 'date', value: rel(7) }], onSubmit: v => DB.receivables.push({ ...v, id: uid('r'), paid: false }) }); }
function formCost(kind) { openForm({ title: kind === 'fixo' ? 'Novo custo fixo' : 'Novo custo de projeto', fields: [{ k: 'name', label: 'Descrição', required: true, full: true }, { k: 'value', label: 'Valor', type: 'number', required: true }, ...(kind === 'variavel' ? [{ k: 'projectId', label: 'Projeto', type: 'select', options: DB.projects.map(p => [p.id, p.title]) }, { k: 'date', label: 'Data', type: 'date', value: iso(TODAY) }] : [])], onSubmit: v => DB.costs.push({ ...v, kind, id: uid('co') }) }); }
function delCost(id) { confirmBox('Remover este custo?', () => DB.costs = DB.costs.filter(c => c.id !== id), 'Remover'); }
