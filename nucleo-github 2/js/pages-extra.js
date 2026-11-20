/* ==========================================================
   Fase 3 e 4 — Relatórios, SUNtendências, Agenda, Biblioteca,
   Configurações
   ========================================================== */

/* ============ 8. RELATÓRIOS ============ */
UI.repMonth = null;
function monthSummary(k) {
  const fat = DB.projects.filter(p => ym(p.due) === k).reduce((s, p) => s + p.value, 0) || paidIn(k);
  const rec = paidIn(k), cst = costsIn(k), lucro = rec - cst;
  const aRec = openReceivables().reduce((s, r) => s + r.value, 0);
  const newC = DB.clients.filter(c => ym(c.since) === k).length, ended = DB.clients.filter(c => c.status === 'Encerrado' && ym(c.last) === k).length;
  const leadsK = DB.leads.filter(l => ym(l.date) === k), conv = DB.clients.filter(c => c.fromLead && ym(c.since) === k).length;
  const delivered = DB.projects.filter(p => ['Finalizado', 'Entregue'].includes(p.stage) && ym(p.due) === k).length;
  const approved = DB.approvals.filter(a => a.status === 'aprovado').length;
  const hours = DB.projects.reduce((s, p) => s + p.hours, 0);
  const bySvc = {}; DB.payments.filter(p => ym(p.date) === k).forEach(p => { const sid = project(p.projectId)?.serviceId || client(p.clientId)?.service; bySvc[sid] = (bySvc[sid] || 0) + p.value; });
  const byCli = {}; DB.payments.filter(p => ym(p.date) === k).forEach(p => byCli[p.clientId] = (byCli[p.clientId] || 0) + p.value);
  const topSvc = Object.entries(bySvc).sort((a, b) => b[1] - a[1])[0], topCli = Object.entries(byCli).sort((a, b) => b[1] - a[1])[0];
  const byNiche = {}; Object.entries(byCli).forEach(([cid, v]) => (client(cid)?.niches || []).forEach(n => byNiche[n] = (byNiche[n] || 0) + v));
  const topN = Object.entries(byNiche).sort((a, b) => b[1] - a[1])[0];
  const appr = DB.approvals.filter(a => a.respondedAt); const avgAppr = appr.length ? (appr.reduce((s, a) => s + Math.max(0, daysBetween(a.sentAt, a.respondedAt.length > 10 ? iso(TODAY) : a.sentAt) + 1), 0) / appr.length) : 0;
  const avgChanges = DB.projects.length ? DB.projects.reduce((s, p) => s + p.changesUsed, 0) / DB.projects.length : 0;
  const lateDel = DB.projects.filter(p => daysFromToday(p.due) < 0 && !['Finalizado', 'Entregue'].includes(p.stage)).length;
  return { fat, rec, aRec, cst, lucro, margem: rec ? Math.round(lucro / rec * 100) : 0, active: DB.clients.filter(c => c.status === 'Ativo').length, newC, ended, convPct: leadsK.length ? Math.round(conv / leadsK.length * 100) : 0, delivered, approved, hours, topSvc, topCli, topN, avgAppr, avgChanges, lateDel };
}
PAGES.relatorios = (sub) => {
  sub = sub || 'resumo';
  const k = UI.repMonth || prevYM(curYM);
  const months = Array.from({ length: 12 }, (_, i) => prevYM(curYM, i));
  const sel = `<select class="field-inline" onchange="UI.repMonth=this.value;route()">${months.map(m => `<option value="${m}" ${m === k ? 'selected' : ''}>${ymLabel(m)}</option>`).join('')}</select>`;
  const head = pageHead('Relatórios', 'Todo dia 1º o sistema monta sozinho o resumo do mês anterior.', `${sel}<button class="btn primary" onclick="window.print()">${icon('print')} Exportar PDF</button>`);
  const tabs = subTabs('relatorios', NAV[7].subs, sub);
  if (sub === 'comparativo') {
    const ms = Array.from({ length: 12 }, (_, i) => prevYM(curYM, 11 - i)); const rec = ms.map(paidIn), luc = ms.map(m => paidIn(m) - costsIn(m)); const ly = ms.map(m => paidIn(prevYM(m, 12)));
    return head + tabs + `<div class="card"><div class="card-head"><h2>Faturamento e lucro · 12 meses</h2><div class="legend"><span><span class="pill pink nodot">●</span> Faturamento</span><span><span class="pill ok nodot">●</span> Lucro</span><span><span class="pill nodot">●</span> Mesmo mês ano anterior</span></div></div>${lineChart(ms, [{ v: rec, c: '#FF5C90', w: 3 }, { v: luc, c: '#3DBE7A', w: 2.5 }, { v: ly, c: '#B9B4AD', w: 2, dash: true }])}</div>`;
  }
  if (sub === 'porcliente') {
    const byC = {}, byS = {}; DB.payments.filter(p => ym(p.date) === k).forEach(p => { byC[p.clientId] = (byC[p.clientId] || 0) + p.value; const sid = project(p.projectId)?.serviceId || client(p.clientId)?.service; byS[sid] = (byS[sid] || 0) + p.value; });
    const hrsC = {}, hrsS = {}; DB.projects.forEach(p => { hrsC[p.clientId] = (hrsC[p.clientId] || 0) + p.hours; hrsS[p.serviceId] = (hrsS[p.serviceId] || 0) + p.hours; });
    const tbl = (obj, hrs, nameFn) => { const max = Math.max(...Object.values(obj), 1); return `<div class="list">${Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([id, v]) => `<div class="row"><div class="grow"><div class="title">${esc(nameFn(id))}</div><div class="progress pink" style="height:6px;margin-top:6px"><span style="width:${v / max * 100}%"></span></div></div><div class="right"><b class="num">${brl(v)}</b><div class="small muted">${(hrs[id] || 0).toFixed(1)}h</div></div></div>`).join('') || empty('Sem recebimentos no período.')}</div>`; };
    return head + tabs + `<div class="grid g2"><div class="card"><h2 style="margin-bottom:12px">Por cliente · ${ymLabel(k)}</h2>${tbl(byC, hrsC, clientName)}</div><div class="card"><h2 style="margin-bottom:12px">Por serviço · ${ymLabel(k)}</h2>${tbl(byS, hrsS, id => service(id)?.name || 'Outros')}</div></div>
      <div class="card" style="margin-top:18px"><div class="card-head"><h2>Relatório para cliente de social media</h2></div><div class="actions">${DB.clients.filter(c => service(c.service)?.monthly && c.status === 'Ativo').map(c => `<button class="btn" onclick="clientReport('${c.id}','${k}')">${icon('download')} ${esc(c.brand)}</button>`).join('')}</div></div>`;
  }
  if (sub === 'exportar') return head + tabs + `<div class="grid g3"><div class="card hover" style="cursor:pointer" onclick="HASH.v='#/relatorios/resumo';setTimeout(()=>print(),400)"><h2>${icon('file')} Resumo mensal</h2><p class="muted small">Dinheiro, clientes, produção, destaques e qualidade, com a identidade do Studio Sun.</p></div>${DB.clients.filter(c => service(c.service)?.monthly && c.status === 'Ativo').map(c => `<div class="card hover" style="cursor:pointer" onclick="clientReport('${c.id}','${k}')"><h2>${icon('users')} ${esc(c.brand)}</h2><p class="muted small">Posts entregues no mês — pronto para mandar ao cliente.</p></div>`).join('')}</div>`;
  const s = monthSummary(k);
  const block = (t, ico, rows) => `<div class="card"><h2 style="margin-bottom:12px">${icon(ico).replace('<svg', '<svg style="width:18px;vertical-align:-3px;color:var(--pink)"')} ${t}</h2><div class="list">${rows.map(([l, v, hl]) => `<div class="row"><span class="grow muted">${l}</span><b class="num" style="${hl ? 'color:' + hl : ''}">${v}</b></div>`).join('')}</div></div>`;
  return head + tabs + `<div class="card soft" style="margin-bottom:18px;display:flex;align-items:center;gap:16px"><div class="logo-fx dark" style="width:70px"></div><div><h2 style="text-transform:capitalize">Resumo de ${ymLabel(k)}</h2><div class="small muted">Gerado automaticamente em 1º de ${MONTHS[(parse(k + '-01').getMonth() + 1) % 12]}</div></div></div>
    <div class="grid g3">${block('Dinheiro', 'money', [['Faturado', brl(s.fat)], ['Recebido', brl(s.rec)], ['A receber', brl(s.aRec)], ['Custos', brl(s.cst)], ['Lucro', brl(s.lucro), s.lucro >= 0 ? 'var(--ok)' : 'var(--danger)'], ['Margem', s.margem + '%']])}
    ${block('Clientes', 'users', [['Ativos', s.active], ['Novos', s.newC], ['Encerrados', s.ended], ['Leads que viraram clientes', s.convPct + '%']])}
    ${block('Produção', 'kanban', [['Projetos entregues', s.delivered], ['Peças aprovadas', s.approved], ['Horas trabalhadas', s.hours.toFixed(1) + 'h']])}
    ${block('Destaques', 'star', [['Serviço que mais vendeu', esc(service(s.topSvc?.[0])?.name || '—')], ['Cliente que mais rendeu', esc(clientName(s.topCli?.[0]))], ['Nicho mais forte', esc(DB.niches.find(n => n.id === s.topN?.[0])?.name || '—')]])}
    ${block('Qualidade', 'checkCircle', [['Tempo médio de aprovação', s.avgAppr.toFixed(1) + ' dias'], ['Média de alterações por projeto', s.avgChanges.toFixed(1)], ['Entregas atrasadas', s.lateDel, s.lateDel ? 'var(--danger)' : '']])}</div>`;
};
function lineChart(labels, series) {
  const W = 900, H = 260, pl = 50, pr = 16, pt = 16, pb = 30; const all = series.flatMap(s => s.v); const max = Math.max(...all, 1) * 1.1, min = Math.min(0, ...all);
  const x = i => pl + i * (W - pl - pr) / (labels.length - 1), y = v => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
  const grid = [0, .25, .5, .75, 1].map(f => { const v = min + (max - min) * f; return `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Gráfico comparativo">${grid}${labels.map((l, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)">${MONTHS_S[parse(l + '-01').getMonth()]}</text>`).join('')}
    ${series.map(s => `<polyline fill="none" stroke="${s.c}" stroke-width="${s.w}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="5 5"' : ''} points="${s.v.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>${s.dash ? '' : s.v.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${s.c}"><title>${ymLabel(labels[i])}: ${brl(v)}</title></circle>`).join('')}`).join('')}</svg>`;
}
function clientReport(cid, k) {
  const c = client(cid), posts = DB.posts.filter(p => p.clientId === cid), w = window.open('', '_blank'); if (!w) return toast('Não deu para abrir a janela do PDF aqui. Abra o Núcleo direto no navegador do computador para gerar o PDF.', 'alert');
  const col = c.identity.palette[0]?.hex || '#FF5C90';
  w.document.write(`<!doctype html><html><head><title>Relatório · ${esc(c.brand)}</title><style>body{font-family:Inter,system-ui,sans-serif;margin:44px;color:#2c2c2c}h1{font-family:Sora,sans-serif;margin:0}.bar{height:8px;background:${col};border-radius:4px;margin:14px 0 24px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}</style></head><body><div style="color:#888">Studio Sun · Relatório mensal</div><h1>${esc(c.brand)} — ${ymLabel(k)}</h1><div class="bar"></div><p><b>${posts.length}</b> posts no calendário · <b>${posts.filter(p => p.status === 'publicado').length}</b> publicados · <b>${DB.approvals.filter(a => a.clientId === cid && a.status === 'aprovado').length}</b> peças aprovadas</p><table><tr><th>Data</th><th>Post</th><th>Formato</th><th>Status</th></tr>${posts.map(p => `<tr><td>${fmtDate(p.date)}</td><td>${esc(p.title)}</td><td>${p.format}</td><td>${p.status}</td></tr>`).join('')}</table><script>setTimeout(()=>print(),400)<\/script></body></html>`); w.document.close();
}

/* ============ 9. SUNtendências ============ */
const FMT_LABEL = { reels: 'Reels', carrossel: 'Carrossel', estatico: 'Estático' };
const OBJ = ['ensinar', 'engajar', 'gerar autoridade', 'atrair cliente'];
function buildPost(tr, date, i) {
  const fmt = tr.fmt;
  const script = fmt === 'reels' ? ['Gancho (0–3s): “Você ainda faz isso do jeito difícil?”', 'Passo 1: abra o arquivo e selecione o texto', 'Passo 2: aplique o efeito com a ferramenta certa', 'Passo 3: ajuste cor e sombra', 'Resultado final lado a lado', 'CTA: “Salva pra testar depois e me conta!”']
    : fmt === 'carrossel' ? ['Capa: título chamativo + visual forte', 'Página 2: o problema', 'Páginas 3–5: desenvolvimento com valor', 'Página 6: dicas práticas', 'Página 7: CTA “salva e manda pra amiga designer”'] : ['Frase forte em destaque', 'Assinatura do Studio Sun'];
  return { id: uid('pp'), date, time: ['12:00', '18:30', '19:00', '11:30'][i % 4], fmt, title: tr.title, obj: OBJ[i % 4], trend: tr.title, script,
    caption: `${tr.title} — do jeito simples ✨\n${fmt === 'reels' ? 'Testa aí e me conta o resultado.' : 'Salva esse post pra consultar depois.'}\n👉 Quer uma marca que chama atenção assim? Link na bio.`, status: 'sugerido' };
}
function generatePlan(monthKey, opts = {}) {
  const [y, m] = monthKey.split('-').map(Number); const days = new Date(y, m, 0).getDate();
  const freq = Math.max(4, Math.min(31, DB.sun.rules.freq || 15));
  const pool = DB.sun.trends.filter(t => t.temp !== 'caindo'); const src = opts.only ? pool.filter(opts.only) : pool;
  const plan = []; for (let i = 0; i < freq; i++) { const day = Math.round(1 + i * (days - 1) / (freq - 1 || 1)); const tr = (src.length ? src : pool)[i % (src.length || pool.length)]; plan.push(buildPost({ ...tr, fmt: i % 5 === 4 ? 'estatico' : i % 2 ? 'carrossel' : 'reels' }, `${monthKey}-${pad(day)}`, i)); }
  return plan;
}
PAGES.sun = (sub) => {
  sub = sub || 'radar';
  const hero = `<div class="sun-hero">${SUN_SVG}<div style="position:relative"><div class="small" style="font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.8">IA do Núcleo</div><h1>SUNtendências</h1><p style="margin:6px 0 0;max-width:560px">Todo mês pesquisa as tendências e entrega pronto o plano de conteúdo do seu Instagram, seguindo as suas regras: ensinar design, Affinity e Canva, gerar conteúdo salvável e atrair clientes.</p></div></div>`;
  const tabs = subTabs('sun', NAV[8].subs, sub);
  const chat = `<div class="card" style="margin-top:18px"><div class="card-head"><h2>${icon('message')} Conversa com a IA</h2><span class="small muted">simulação local</span></div><div class="chat" id="chat">${DB.sun.chat.map(m => `<div class="msg ${m.from === 'me' ? 'me' : 'ai'}">${esc(m.t)}</div>`).join('')}</div>
    <div class="chips" style="margin:12px 0">${['Gerar o plano de dezembro', 'Mais ideias para atléticas', 'Uma semana só de Affinity', 'Transforma esse carrossel em Reels'].map(t => `<span class="chip" onclick="sunAsk('${t}')">${t}</span>`).join('')}</div>
    <form onsubmit="event.preventDefault();sunAsk(this.q.value);this.q.value=''" style="display:flex;gap:8px"><input name="q" class="field-inline" style="flex:1" placeholder="Peça algo para a SUNtendências…" required><button class="btn primary">${icon('send')}</button></form></div>`;
  if (sub === 'plano') {
    const k = UI.sunMonth || prevYM(curYM, -1);
    const plan = DB.sun.plan.filter(p => ym(p.date) === k);
    const [y, m] = k.split('-').map(Number); const first = new Date(y, m - 1, 1); const weeks = []; let d = addDays(first, -((first.getDay() + 6) % 7));
    while (d.getMonth() <= m - 1 && d.getFullYear() <= y || weeks.length === 0) { const w = []; for (let i = 0; i < 7; i++) { w.push(iso(d)); d = addDays(d, 1); } weeks.push(w); if (d.getMonth() !== m - 1 && weeks.length >= 4) break; }
    return hero + tabs + `<div class="toolbar"><button class="btn sm" onclick="UI.sunMonth=prevYM('${k}');route()">${icon('chevL')}</button><h2 style="text-transform:capitalize;min-width:170px;text-align:center">${ymLabel(k)}</h2><button class="btn sm" onclick="UI.sunMonth=prevYM('${k}',-1);route()">${icon('chev')}</button><span class="grow"></span><div class="legend"><span class="post-tag reels">Reels</span><span class="post-tag carrossel">Carrossel</span><span class="post-tag estatico">Estático</span></div><button class="btn primary" onclick="sunAsk('Gerar o plano de ${MONTHS[m - 1]}')">${icon('sparkle')} ${plan.length ? 'Gerar de novo' : 'Gerar plano'}</button></div>
      ${plan.length ? `<p class="small muted" style="margin-top:0">${plan.length} posts · ${plan.filter(p => p.status === 'aprovado').length} aprovados · ${plan.filter(p => p.status === 'produção').length} em produção</p>${weeks.map((w, wi) => `<div style="margin-bottom:14px"><div class="small muted" style="font-weight:700;margin-bottom:6px">Semana ${wi + 1}</div><div class="week">${w.map(day => `<div class="wd" style="${ym(day) !== k ? 'opacity:.35' : ''}"><span class="h">${WEEK[parse(day).getDay()]} ${parse(day).getDate()}</span>${plan.filter(p => p.date === day).map(p => `<div class="post-tag ${p.fmt} ${p.status !== 'sugerido' ? 'ok' : ''}" onclick="openPost('${p.id}')">${esc(p.title)}</div>`).join('')}</div>`).join('')}</div></div>`).join('')}` : empty('Ainda não há plano para este mês. A IA monta tudo em segundos.', 'sun', `<button class="btn primary" onclick="sunAsk('Gerar o plano de ${MONTHS[m - 1]}')">${icon('sparkle')} Gerar plano</button>`)}` + chat;
  }
  if (sub === 'ideias') return hero + tabs + `<div class="toolbar"><button class="btn sm" onclick="openForm({title:'Nova ideia',fields:[{k:'title',label:'Ideia',full:true,required:true},{k:'fmt',label:'Formato',type:'select',options:[['reels','Reels'],['carrossel','Carrossel'],['estatico','Estático']]}],onSubmit:v=>DB.sun.ideas.unshift({...v,id:uid('i')})})">${icon('plus')} Salvar ideia</button></div><div class="grid g3">${DB.sun.ideas.map(i => `<div class="card hover"><span class="post-tag ${i.fmt}" style="display:inline-block;margin-bottom:10px">${FMT_LABEL[i.fmt]}</span><h3>${esc(i.title)}</h3><div class="actions" style="margin-top:12px"><button class="btn sm primary" onclick="ideaToPlan('${i.id}')">${icon('calendar')} Usar no plano</button><button class="btn ghost sm" onclick="DB.sun.ideas=DB.sun.ideas.filter(x=>x.id!=='${i.id}');save();route()">${icon('trash')}</button></div></div>`).join('') || empty('Banco vazio.', 'bulb')}</div>`;
  if (sub === 'desempenho') {
    const perf = [{ t: 'Texto efeito recorte de papel', f: 'reels', s: 412, c: 96, a: 8400, tr: 'subindo' }, { t: 'Análise de rebrand', f: 'carrossel', s: 655, c: 140, a: 6100, tr: 'no pico' }, { t: 'Canva: atalhos escondidos', f: 'reels', s: 230, c: 51, a: 5200, tr: 'subindo' }, { t: '“Design bom é invisível”', f: 'estatico', s: 48, c: 22, a: 1900, tr: '—' }];
    return hero + tabs + `<div class="grid g4 kpis" style="margin-bottom:18px"><div class="card kpi accent"><div class="label">Salvamentos</div><div class="value">1.345</div><div class="delta">▲ 32% vs. mês anterior</div></div><div class="card kpi"><div class="label">Compartilhamentos</div><div class="value">309</div></div><div class="card kpi"><div class="label">Alcance</div><div class="value">21,6k</div></div><div class="card kpi"><div class="label">Novos seguidores</div><div class="value">+418</div></div></div>
      <div class="card table-wrap"><div class="card-head"><h2>Resultado por post</h2><span class="small muted">dados de exemplo — conecte o Instagram para dados reais</span></div><table class="table"><thead><tr><th>Post</th><th>Formato</th><th class="right">Salvamentos</th><th class="right">Compart.</th><th class="right">Alcance</th></tr></thead><tbody>${perf.map(p => `<tr><td><b>${p.t}</b></td><td><span class="post-tag ${p.f}" style="display:inline-block">${FMT_LABEL[p.f]}</span></td><td class="right num">${p.s}</td><td class="right num">${p.c}</td><td class="right num">${p.a.toLocaleString('pt-BR')}</td></tr>`).join('')}</tbody></table>
      <p class="small" style="margin-bottom:0"><b>Aprendizado da IA:</b> carrosséis de análise de marcas reais geram 2× mais salvamentos; próximo plano terá mais desse formato.</p></div>`;
  }
  if (sub === 'regras') {
    const r = DB.sun.rules;
    return hero + tabs + `<div class="grid g2"><div class="card"><h2 style="margin-bottom:14px">Regras da IA · sua skill de conteúdo</h2><div class="form" style="grid-template-columns:1fr">
      ${[['tone', 'Tom de voz'], ['goals', 'Objetivos'], ['formats', 'Formatos'], ['themes', 'Temas prioritários'], ['avoid', 'Temas a evitar']].map(([k, l]) => `<div class="f"><label>${l}</label><textarea onchange="DB.sun.rules.${k}=this.value;save();toast('Regra salva')" style="min-height:64px">${esc(r[k])}</textarea></div>`).join('')}
      <div class="f"><label>Posts por mês: <b id="fv">${r.freq}</b></label><input type="range" min="8" max="22" value="${r.freq}" oninput="document.getElementById('fv').textContent=this.value" onchange="DB.sun.rules.freq=+this.value;save()"></div></div>
      <div class="card soft" style="margin-top:14px;font-size:13px"><b>${icon('alert').replace('<svg', '<svg style="width:15px;vertical-align:-2px"')} Decisão em aberto:</b> a skill pede 4–5 posts por semana (16 a 22/mês), mas você também falou em no máximo 15/mês. O padrão está em <b>${r.freq}</b> — ajuste aqui.</div></div>
      <div class="card"><h2 style="margin-bottom:14px">Estrutura por formato</h2><div class="list">${[['reels', 'Reels (foco principal)', 'Ensino prático no Affinity ou Canva', 'Gancho nos 3 primeiros segundos → passo a passo simples → resultado final → CTA'], ['carrossel', 'Carrossel', 'Conteúdo salvável', 'Capa chamativa → desenvolvimento com valor → dicas práticas → CTA'], ['estatico', 'Estático', 'Autoridade e posicionamento', 'Frase forte, opinião sobre design ou dica rápida']].map(([f, n, foco, est]) => `<div class="row" style="align-items:flex-start"><span class="post-tag ${f}" style="flex:none">${n}</span><div class="grow"><b class="small">${foco}</b><div class="small muted">${est}</div></div></div>`).join('')}</div></div></div>`;
  }
  return hero + tabs + `<div class="grid g3">${DB.sun.trends.map(t => `<div class="card hover" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="post-tag ${t.fmt}">${FMT_LABEL[t.fmt]}</span><span class="thermo" style="color:${t.temp === 'subindo' ? 'var(--ok)' : t.temp === 'no pico' ? 'var(--pink)' : 'var(--muted)'}">${icon(t.temp === 'caindo' ? 'trendDown' : t.temp === 'no pico' ? 'flame' : 'trend').replace('<svg', '<svg style="width:15px"')} ${t.temp}</span></div><h3>${esc(t.title)}</h3><p class="small muted" style="margin:0"><b style="color:var(--text)">Por que está em alta:</b> ${esc(t.why)}</p><p class="small" style="margin:0"><b>Como usar no seu nicho:</b> ${esc(t.use)}</p><button class="btn primary sm" style="margin-top:auto;align-self:flex-start" onclick="trendToPost('${t.id}')">${icon('sparkle')} Transformar em post</button></div>`).join('')}</div>` + chat;
};
PAGES.sun.after = () => { const c = document.getElementById('chat'); if (c) c.scrollTop = c.scrollHeight; };
function trendToPost(id) { const t = DB.sun.trends.find(x => x.id === id); const p = buildPost(t, rel(3), DB.sun.plan.length); DB.sun.plan.push(p); save(); toast('Post criado no Plano do mês'); openPost(p.id); }
function ideaToPlan(id) { const i = DB.sun.ideas.find(x => x.id === id); const p = buildPost({ title: i.title, fmt: i.fmt }, rel(5), 1); DB.sun.plan.push(p); DB.sun.ideas = DB.sun.ideas.filter(x => x.id !== id); save(); UI.sunMonth = ym(p.date); HASH.v = '#/sun/plano'; toast('Ideia levada para o plano'); }
function openPost(id) {
  const p = DB.sun.plan.find(x => x.id === id);
  openModal(`${modalHead(esc(p.title))}<div class="modal-body"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"><span class="post-tag ${p.fmt}">${FMT_LABEL[p.fmt]}</span>${pill('Objetivo: ' + p.obj, 'nodot')}${pill(fmtDate(p.date) + ' · ' + p.time, 'nodot')}${pill(p.status, p.status === 'sugerido' ? 'yellow' : 'ok')}</div>
    <div class="small muted" style="margin-bottom:4px">Tendência de origem</div><p style="margin:0 0 14px">${esc(p.trend)}</p>
    <div class="small muted" style="margin-bottom:4px">Roteiro ${p.fmt === 'reels' ? 'cena a cena' : p.fmt === 'carrossel' ? 'página a página' : ''}</div><ol style="margin:0 0 14px;padding-left:20px;font-size:13.5px;line-height:1.7">${p.script.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="small muted" style="margin-bottom:4px">Legenda pronta</div><div class="card flat" style="white-space:pre-wrap;font-size:13.5px">${esc(p.caption)}</div></div>
    <div class="modal-foot"><button class="btn ghost" onclick="swapPost('${p.id}')">${icon('refresh')} Trocar ideia</button><button class="btn" onclick="copyText(DB.sun.plan.find(x=>x.id==='${p.id}').caption,'Legenda copiada')">${icon('copy')} Legenda</button>${p.status === 'sugerido' ? `<button class="btn" onclick="setPostStatus('${p.id}','aprovado')">${icon('check')} Aprovar</button>` : ''}${p.status !== 'produção' ? `<button class="btn primary" onclick="sendToProduction('${p.id}')">${icon('send')} Enviar para produção</button>` : ''}</div>`);
}
function setPostStatus(id, s) { DB.sun.plan.find(x => x.id === id).status = s; save(); closeModal(); route(); }
function swapPost(id) { const p = DB.sun.plan.find(x => x.id === id); const pool = DB.sun.trends.filter(t => t.title !== p.trend && t.temp !== 'caindo'); const t = pool[Math.floor(Math.random() * pool.length)]; Object.assign(p, buildPost({ ...t, fmt: p.fmt }, p.date, 2), { id: p.id }); save(); closeModal(); route(); openPost(id); toast('Ideia trocada por outra tendência'); }
function sendToProduction(id) {
  const p = DB.sun.plan.find(x => x.id === id); p.status = 'produção';
  DB.posts.push({ id: uid('po'), clientId: null, title: p.title, date: p.date, status: 'rascunho', format: p.fmt });
  DB.tasks.push({ id: uid('t'), title: `Produzir ${FMT_LABEL[p.fmt]}: ${p.title}`, date: iso(addDays(parse(p.date), -2)), done: false });
  save(); closeModal(); route(); toast('Foi para Agenda › Calendário de posts e virou tarefa com prazo');
}
function sunAsk(q) {
  DB.sun.chat.push({ from: 'me', t: q }); const lq = q.toLowerCase(); let a;
  const mi = MONTHS.findIndex(m => lq.includes(m));
  if (/plano|gerar/.test(lq)) {
    const y = mi >= 0 && mi < TODAY.getMonth() ? TODAY.getFullYear() + 1 : TODAY.getFullYear(); const k = mi >= 0 ? `${y}-${pad(mi + 1)}` : prevYM(curYM, -1);
    DB.sun.plan = DB.sun.plan.filter(p => ym(p.date) !== k || p.status !== 'sugerido').concat(generatePlan(k));
    UI.sunMonth = k; a = `Pronto! Montei o plano de ${ymLabel(k)} com ${DB.sun.rules.freq} posts, misturando Reels, carrossel e estático a partir das tendências que estão subindo ou no pico. Abre o Plano do mês para revisar post por post.`;
    save(); setTimeout(() => HASH.v = '#/sun/plano', 50);
  } else if (/atl[eé]tica/.test(lq)) { ['Bastidores da identidade de uma atlética', 'Como montar o kit de calouros no Canva', 'Mascote de atlética: do rascunho ao vetor'].forEach(t => DB.sun.ideas.unshift({ id: uid('i'), title: t, fmt: 'carrossel' })); a = 'Salvei 3 ideias para atléticas no Banco de ideias: bastidores de identidade, kit de calouros no Canva e mascote do rascunho ao vetor.'; }
  else if (/affinity/.test(lq)) { const k = UI.sunMonth || prevYM(curYM, -1); const only = generatePlan(k).slice(0, 5).map((p, i) => ({ ...p, fmt: 'reels', title: ['Affinity: degradê em texto', 'Affinity: máscara de recorte', 'Affinity: efeito neon', 'Affinity: mockup rápido', 'Affinity: vetorizar logo'][i], trend: 'Semana temática Affinity' })); DB.sun.plan.push(...only); a = 'Criei uma semana só de Affinity com 5 Reels práticos. Já estão no plano como “sugerido”.'; }
  else if (/reels/.test(lq) && /carrossel/.test(lq)) { const c = DB.sun.plan.find(p => p.fmt === 'carrossel' && p.status === 'sugerido'); if (c) { Object.assign(c, buildPost({ title: c.title, fmt: 'reels' }, c.date, 0), { id: c.id, trend: c.trend }); a = `Transformei “${c.title}” em Reels, com gancho nos 3 primeiros segundos e roteiro cena a cena.`; } else a = 'Não achei carrossel sugerido no plano para transformar. Gera um plano primeiro?'; }
  else if (/troca/.test(lq)) a = 'Abre o post no Plano do mês e clica em “Trocar ideia” — eu troco por outra da mesma linha de tendência.';
  else a = 'Anotado! Posso gerar um plano, trazer ideias para um nicho (ex.: “mais ideias para atléticas”), montar uma semana temática ou transformar formatos.';
  DB.sun.chat.push({ from: 'ai', t: a }); save(); route();
}

/* ============ 10. AGENDA ============ */
UI.agendaFilter = { prazo: true, reuniao: true, post: true, data: true, pag: true };
PAGES.agenda = (sub) => {
  sub = sub || 'prazos';
  const head = pageHead('Agenda', 'Todas as datas do estúdio num calendário só.', `<button class="btn" onclick="formMeeting()">${icon('plus')} Reunião</button><button class="btn primary" onclick="formDate()">${icon('plus')} Data</button>`);
  const tabs = subTabs('agenda', NAV[9].subs, sub);
  if (sub === 'reunioes') return head + tabs + `<div class="card"><div class="list">${[...DB.meetings].sort((a, b) => a.date.localeCompare(b.date)).map(m => `<div class="row"><div style="text-align:center;min-width:52px"><div style="font-family:var(--f-title);font-weight:700;font-size:20px">${parse(m.date).getDate()}</div><div class="small muted">${MONTHS_S[parse(m.date).getMonth()]} · ${m.time}</div></div>${clientLogo(m.clientId, 32)}<div class="grow"><div class="title">${esc(m.title)}</div><div class="sub">${esc(clientName(m.clientId))} · ${countdown(daysFromToday(m.date))}</div></div>${m.link ? `<a class="btn sm" href="${esc(m.link)}" target="_blank" rel="noopener">${icon('video')} Entrar</a>` : ''}<button class="btn sm" onclick="meetingNotes('${m.id}')">${icon('edit')} Anotações</button></div>`).join('') || empty('Nenhuma reunião marcada.')}</div></div>`;
  if (sub === 'posts') {
    const st = { 'rascunho': '', 'em aprovação': 'yellow', 'aprovado': 'ok', 'publicado': 'dark' };
    return head + tabs + `<div class="legend" style="margin-bottom:12px">${Object.entries(st).map(([s, c]) => pill(s, c)).join('')}</div>` + monthCalendar(UI.calMonth || curYM, day => DB.posts.filter(p => p.date === day).map(p => `<div class="ev post" style="${p.status === 'em aprovação' ? 'background:var(--yellow);color:var(--yellow-ink)' : p.status === 'rascunho' ? 'background:#EFEAE4;color:#5C544B' : p.status === 'publicado' ? 'background:var(--ink);color:#fff' : ''}" title="${esc(p.title)} · ${p.status}" onclick="cyclePost('${p.id}')">${p.clientId ? esc(clientName(p.clientId).split(' ')[0]) + ': ' : '☀️ '}${esc(p.title)}</div>`).join('')) + '<p class="small muted">Clique num post para avançar o status. Os posts do seu perfil chegam prontos do SUNtendências.</p>';
  }
  if (sub === 'datas') {
    const y = TODAY.getFullYear(); const saz = seasonalDates(y);
    return head + tabs + `<div class="grid g2"><div class="card"><div class="card-head"><h2>Datas sazonais · ${y}</h2><span class="small muted">atualizadas todo ano</span></div><div class="list">${saz.map(d => { const hid = DB.hiddenSeasonal.includes(d.name); return `<div class="row" style="${hid ? 'opacity:.45' : ''}"><span class="pill ${d.type === 'Feriado' ? '' : d.type === 'Comércio' ? 'pink' : 'yellow'} nodot" style="min-width:56px;justify-content:center">${d.month ? MONTHS_S[parse(d.day).getMonth()] : fmtDate(d.day)}</span><div class="grow"><div class="title">${esc(d.name)}</div><div class="sub">${d.type}</div></div><button class="btn ghost sm" onclick="toggleSeasonal('${esc(d.name)}')">${hid ? 'Mostrar' : 'Ocultar'}</button></div>`; }).join('')}</div></div>
      <div class="card" style="align-self:start"><div class="card-head"><h2>Suas datas</h2><button class="btn primary sm" onclick="formDate()">${icon('plus')} Data</button></div><div class="list">${DB.myDates.map(d => `<div class="row"><span class="pill yellow nodot">${fmtDate(d.day)}</span><div class="grow"><div class="title">${esc(d.name)}</div><div class="sub">${d.type}${d.clientId ? ' · ' + esc(clientName(d.clientId)) : ''}${d.repeat ? ' · todo ano' : ''} · aviso ${d.notice} dias antes</div></div><button class="btn ghost sm" onclick="formDate('${d.id}')">${icon('edit')}</button><button class="btn ghost sm" onclick="DB.myDates=DB.myDates.filter(x=>x.id!=='${d.id}');save();route()">${icon('trash')}</button></div>`).join('') || empty('Nenhuma data sua ainda.')}</div></div></div>`;
  }
  const f = UI.agendaFilter;
  const types = [['prazo', 'Entregas'], ['pag', 'Vencimentos'], ['reuniao', 'Reuniões'], ['post', 'Posts'], ['data', 'Datas']];
  return head + tabs + `<div class="toolbar">${types.map(([k, l]) => `<label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" ${f[k] ? 'checked' : ''} onchange="UI.agendaFilter.${k}=this.checked;route()"><span class="ev ${k}" style="cursor:pointer">${l}</span></label>`).join('')}</div>` +
    monthCalendar(UI.calMonth || curYM, day => [
      ...(f.prazo ? DB.projects.filter(p => p.due === day && p.stage !== 'Entregue').map(p => `<div class="ev prazo" onclick="HASH.v='#/projetos/p/${p.id}'" title="Entrega: ${esc(p.title)}">${esc(p.title)}</div>`) : []),
      ...(f.pag ? DB.receivables.filter(r => r.due === day && !r.paid).map(r => `<div class="ev pag" onclick="HASH.v='#/financeiro/receber'" title="Vencimento">${brl(r.value)} · ${esc(clientName(r.clientId).split(' ')[0])}</div>`) : []),
      ...(f.reuniao ? DB.meetings.filter(m => m.date === day).map(m => `<div class="ev reuniao" onclick="HASH.v='#/agenda/reunioes'">${m.time} ${esc(m.title)}</div>`) : []),
      ...(f.post ? DB.posts.filter(p => p.date === day).map(p => `<div class="ev post" onclick="HASH.v='#/agenda/posts'">${esc(p.title)}</div>`) : []),
      ...(f.data ? allDates().filter(d => d.day === day && !d.month).map(d => `<div class="ev data" title="${esc(d.name)}">${esc(d.name)}</div>`) : []),
    ].join(''));
};
function toggleSeasonal(name) { const h = DB.hiddenSeasonal; const i = h.indexOf(name); i >= 0 ? h.splice(i, 1) : h.push(name); save(); route(); }
function cyclePost(id) { const order = ['rascunho', 'em aprovação', 'aprovado', 'publicado']; const p = DB.posts.find(x => x.id === id); p.status = order[(order.indexOf(p.status) + 1) % order.length]; save(); route(); toast(`${p.title}: ${p.status}`); }
function formMeeting() { openForm({ title: 'Nova reunião', fields: [{ k: 'title', label: 'Assunto', full: true, required: true }, { k: 'clientId', label: 'Cliente', type: 'select', options: clientOpts() }, { k: 'date', label: 'Dia', type: 'date', value: rel(1) }, { k: 'time', label: 'Hora', type: 'time', value: '10:00' }, { k: 'link', label: 'Link da chamada', value: 'https://meet.google.com/' }], onSubmit: v => DB.meetings.push({ ...v, id: uid('mt'), notes: '' }) }); }
function meetingNotes(id) { const m = DB.meetings.find(x => x.id === id); openForm({ title: 'Anotações · ' + esc(m.title), fields: [{ k: 'notes', label: 'Anotações (vão para a ficha do cliente)', type: 'textarea', value: m.notes, full: true }], onSubmit: v => { m.notes = v.notes; if (v.notes) { client(m.clientId).notes.unshift({ d: m.date, t: `Reunião “${m.title}”: ${v.notes}` }); toast('Anotações salvas na ficha do cliente'); } } }); }

/* ============ 11. BIBLIOTECA ============ */
PAGES.biblioteca = (sub) => {
  sub = sub || 'arquivos';
  const head = pageHead('Biblioteca', 'O arquivo organizado do estúdio — nunca mais procurar logo de cliente no WhatsApp.');
  const tabs = subTabs('biblioteca', NAV[10].subs, sub);
  if (sub === 'brandkits') return head + tabs + `<div class="client-cards">${DB.clients.map(c => `<div class="card client-card hover" onclick="UI.clientTab='identidade';HASH.v='#/clientes/c/${c.id}'"><div class="stripe" style="height:46px">${c.identity.palette.map(p => `<span style="background:${p.hex}"></span>`).join('')}</div><div class="body"><div style="display:flex;gap:10px;align-items:center">${clientLogo(c.id, 36)}<div><b>${esc(c.brand)}</b><div class="small muted">${esc(c.identity.fontTitle || 'fonte não definida')}</div></div></div><button class="btn sm" onclick="event.stopPropagation();exportBrandKit('${c.id}')">${icon('download')} Exportar brand kit</button></div></div>`).join('')}</div>`;
  if (sub === 'referencias') return head + tabs + `<div class="toolbar"><button class="btn sm" onclick="openForm({title:'Novo moodboard',fields:[{k:'name',label:'Nome',full:true,required:true},{k:'niche',label:'Nicho',type:'select',options:opts(DB.niches)}],onSubmit:v=>DB.library.refs.push({...v,id:uid('rf')})})">${icon('plus')} Moodboard</button></div><div class="grid g3">${DB.library.refs.map((r, i) => `<div class="card hover" style="padding:0;overflow:hidden"><div style="display:grid;grid-template-columns:2fr 1fr;grid-template-rows:70px 70px;gap:3px">${['#FFD1DE', '#FF5C90', '#FDF4BE'].map((c, j) => `<div style="background:${[c, '#3C3C3C', '#E8B4C8', '#A7B89A'][(i + j) % 4]};${j === 0 ? 'grid-row:span 2' : ''}"></div>`).join('')}</div><div style="padding:14px"><b>${esc(r.name)}</b><div class="small muted">${esc(DB.niches.find(n => n.id === r.niche)?.name || '')}</div></div></div>`).join('')}</div>`;
  if (sub === 'templates') return head + tabs + `<div class="toolbar"><button class="btn sm" onclick="openForm({title:'Novo template',fields:[{k:'name',label:'Nome',full:true,required:true},{k:'kind',label:'Tipo',type:'select',options:['post','carrossel','apresentação','mockup']}],onSubmit:v=>DB.library.templates.push({...v,id:uid('tp')})})">${icon('plus')} Template</button></div><div class="grid g3">${DB.library.templates.map(t => `<div class="folder"><div class="fi" style="background:var(--pink-soft);color:var(--pink-600)">${icon('layers')}</div><div class="grow"><b>${esc(t.name)}</b><div class="small muted">${t.kind}</div></div></div>`).join('')}</div>`;
  if (UI.libClient) { const c = client(UI.libClient); const ps = DB.projects.filter(p => p.clientId === c.id);
    return head + tabs + `<div class="toolbar"><button class="btn" onclick="UI.libClient=null;route()">${icon('chevL')} Clientes</button><h2>${esc(c.brand)}</h2></div><div class="grid g3">${['Artes finais', 'Fontes', 'Fotos recebidas', 'Logos'].map(f => `<div class="folder"><div class="fi">${icon('folder')}</div><div class="grow"><b>${f}</b><div class="small muted">pasta automática</div></div></div>`).join('')}${ps.map(p => `<div class="folder" onclick="HASH.v='#/projetos/p/${p.id}'"><div class="fi" style="background:var(--pink-soft);color:var(--pink-600)">${icon('kanban')}</div><div class="grow"><b>${esc(p.title)}</b><div class="small muted">${p.versions.length} versões</div></div></div>`).join('')}</div>
    <label class="note-add" style="margin-top:16px;min-height:90px;cursor:pointer">${icon('download')} Arraste arquivos aqui ou clique para enviar<input type="file" multiple hidden onchange="toast(this.files.length+' arquivo(s) adicionados a ${esc(c.brand)}')"></label>`; }
  return head + tabs + `<div class="grid g4">${DB.clients.map(c => `<div class="folder" onclick="UI.libClient='${c.id}';route()">${clientLogo(c.id, 44)}<div class="grow"><b>${esc(c.brand)}</b><div class="small muted">${DB.projects.filter(p => p.clientId === c.id).length} projetos</div></div></div>`).join('')}</div>`;
};

/* ============ 12. CONFIGURAÇÕES ============ */
PAGES.config = (sub) => {
  sub = sub || 'estudio';
  const head = pageHead('Configurações', 'Tudo que se configura uma vez só.');
  const tabs = subTabs('config', NAV[11].subs, sub);
  const s = DB.studio;
  const field = (k, l, t = 'text') => `<div class="f"><label>${l}</label><input type="${t}" value="${esc(s[k])}" onchange="DB.studio.${k}=${t === 'number' ? '+this.value' : 'this.value'};save();toast('Salvo');refreshShell()"></div>`;
  if (sub === 'identidade') return head + tabs + `<div class="grid g2"><div class="card"><h2 style="margin-bottom:14px">Logo do sistema</h2><div style="background:var(--ink);border-radius:16px;padding:30px;display:grid;place-items:center;margin-bottom:12px"><div class="logo-fx" style="width:180px"></div></div><div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:30px;display:grid;place-items:center"><div class="logo-fx dark" style="width:140px"></div></div><p class="small muted">A logo Studio Sun aparece com o efeito de brilho rosa → amarelo no menu, e em grafite nos PDFs, contratos e páginas de aprovação.</p></div>
    <div class="card"><h2 style="margin-bottom:14px">Paleta do Núcleo</h2><div class="palette-big">${[['#FF5C90', 'Rosa', 'ação · botões, item ativo, links, gráficos'], ['#3C3C3C', 'Grafite', 'estrutura · painel lateral, títulos'], ['#FDF4BE', 'Amarelo', 'destaque · alertas, metas, selos'], ['#FFD1DE', 'Rosa claro', 'apoio · cards em destaque, etiquetas']].map(([h, n, r]) => `<div class="sw" onclick="copyText('${h}','${h} copiado')"><div class="c" style="background:${h}"></div><div class="i"><b>${n}</b>${h}<br><span class="muted">${r}</span></div></div>`).join('')}</div>
    <h3 style="margin:18px 0 8px">Tipografia</h3><div style="font-family:var(--f-title);font-size:22px;font-weight:700">Sora · títulos e números</div><div>Inter · textos e tabelas</div></div></div>`;
  if (sub === 'pagamentos') return head + tabs + `<div class="card" style="max-width:640px"><div class="form">
    <div class="f full"><label>Formas aceitas</label><div class="actions">${['Pix', 'Cartão', 'Transferência', 'Boleto', 'Dinheiro'].map(m => `<label class="chip" style="display:inline-flex;gap:6px"><input type="checkbox" ${s.methods.includes(m) ? 'checked' : ''} onchange="const a=DB.studio.methods;this.checked?a.push('${m}'):a.splice(a.indexOf('${m}'),1);save()">${m}</label>`).join('')}</div></div>
    ${field('entrada', 'Entrada padrão (%)', 'number')}${field('multa', 'Multa por atraso (%)', 'number')}${field('pix', 'Chave Pix')}</div></div>`;
  if (sub === 'acessos') return head + tabs + `<div class="card" style="max-width:720px"><div class="card-head"><h2>Pessoas com acesso</h2><button class="btn primary sm" onclick="openForm({title:'Convidar parceiro',fields:[{k:'name',label:'Nome',required:true},{k:'email',label:'E-mail',type:'email',required:true},{k:'perms',label:'Permissões',type:'select',options:['Vê projetos · não vê financeiro','Vê projetos e aprovações','Acesso total'],full:true}],submit:'Gerar convite',onSubmit:v=>{DB.access.push({...v,id:uid('ac')});toast('Convite criado')}})">${icon('plus')} Convidar</button></div><div class="list"><div class="row"><div class="avatar">${initials(s.owner)}</div><div class="grow"><div class="title">${esc(s.owner)} (você)</div><div class="sub">${esc(s.email)}</div></div>${pill('Dona', 'pink')}</div>${DB.access.map(a => `<div class="row"><div class="avatar" style="background:var(--yellow)">${initials(a.name)}</div><div class="grow"><div class="title">${esc(a.name)}</div><div class="sub">${esc(a.email)} · ${esc(a.perms)}</div></div><button class="btn ghost sm" onclick="DB.access=DB.access.filter(x=>x.id!=='${a.id}');save();route()">Remover</button></div>`).join('')}</div></div>`;
  if (sub === 'backup') return head + tabs + `<div class="grid g3"><div class="card"><h2>${icon('download')} Planilha (CSV)</h2><p class="small muted">Clientes, projetos e recebimentos em arquivos que abrem no Excel ou Google Planilhas.</p><button class="btn primary" onclick="exportCSV()">Exportar planilhas</button></div>
    <div class="card"><h2>${icon('archive')} Backup completo</h2><p class="small muted">Arquivo .json com todos os dados para restaurar depois.</p><div class="actions"><button class="btn" onclick="exportJSON()">Baixar backup</button><label class="btn">Restaurar<input type="file" accept=".json" hidden onchange="importJSON(this)"></label></div></div>
    <div class="card"><h2>${icon('refresh')} Dados de exemplo</h2><p class="small muted">Os dados ficam salvos neste navegador. Restaure o exemplo para recomeçar.</p><button class="btn danger" onclick="confirmBox('Isso apaga tudo que você cadastrou e volta para os dados de exemplo.',()=>{resetData();toast('Dados restaurados')},'Restaurar exemplo')">Restaurar exemplo</button></div></div>`;
  return head + tabs + `<div class="card" style="max-width:720px"><div class="form">${field('name', 'Nome do estúdio')}${field('owner', 'Seu nome')}${field('cnpj', 'CNPJ / MEI')}${field('city', 'Cidade')}${field('whatsapp', 'WhatsApp')}${field('email', 'E-mail', 'email')}${field('pix', 'Chave Pix')}</div><p class="small muted" style="margin-bottom:0">Esses dados são usados nos contratos e nas cobranças.</p></div>`;
};
function download(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
function toCSV(rows) { return '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'); }
function exportCSV() {
  download('nucleo-clientes.csv', toCSV([['Marca', 'Nome', 'Status', 'Serviço', 'Valor', 'WhatsApp', 'E-mail', 'Cidade'], ...DB.clients.map(c => [c.brand, c.name, c.status, service(c.service)?.name, c.value, c.whatsapp, c.email, c.city])]), 'text/csv');
  download('nucleo-projetos.csv', toCSV([['Projeto', 'Cliente', 'Serviço', 'Etapa', 'Prazo', 'Valor', 'Horas'], ...DB.projects.map(p => [p.title, clientName(p.clientId), service(p.serviceId)?.name, p.stage, p.due, p.value, p.hours])]), 'text/csv');
  download('nucleo-recebimentos.csv', toCSV([['Data', 'Cliente', 'Valor', 'Forma', 'Tipo'], ...DB.payments.map(p => [p.date, clientName(p.clientId), p.value, p.method, p.type])]), 'text/csv');
  toast('3 planilhas exportadas', 'download');
}
function exportJSON() { download(`nucleo-backup-${iso(TODAY)}.json`, JSON.stringify(DB, null, 2), 'application/json'); toast('Backup baixado', 'download'); }
function importJSON(input) { const f = input.files[0]; if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.clients) throw 0; DB = d; save(); toast('Backup restaurado'); route(); } catch (e) { toast('Arquivo inválido', 'alert'); } }); }
