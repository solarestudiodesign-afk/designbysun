/* ==========================================================
   Núcleo — roteador e inicialização
   ========================================================== */
const PREF_KEY = 'nucleo.prefs';
const prefs = (() => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; } })();
const savePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { } };

function route() {
  const parts = (HASH.v || '#/inicio').replace(/^#\/?/, '').split('/');
  const [sec = 'inicio', sub, id] = parts;
  const page = PAGES[sec] || PAGES.inicio;
  const view = document.getElementById('view');
  const prevKey = UI.lastKey, key = sec + '/' + sub + '/' + id;
  view.innerHTML = page(sub, id);
  const scope = view.querySelector('.client-scope');
  document.querySelector('.main').style.background = scope && scope.dataset.bg ? scope.dataset.bg : '';
  if (prevKey !== key) { window.scrollTo(0, 0); document.body.classList.remove('more-open'); }
  UI.lastKey = key;
  page.after && page.after(sub, id);
  enableBoards();
  renderNav(sec, sub);
}

function refreshShell() {
  document.getElementById('foot-name').textContent = DB.studio.owner;
  document.getElementById('foot-avatar').textContent = initials(DB.studio.owner);
}
function applyTheme() {
  document.documentElement.dataset.theme = prefs.theme || 'light';
  document.getElementById('btn-theme').innerHTML = icon(prefs.theme === 'dark' ? 'sunSmall' : 'moon');
}

(function init() {
  if (prefs.collapsed) document.body.classList.add('collapsed');
  applyTheme();
  document.getElementById('btn-theme').onclick = () => { prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark'; savePrefs(); applyTheme(); };
  document.getElementById('btn-collapse').innerHTML = icon('sidebar');
  document.getElementById('btn-collapse').onclick = () => { document.body.classList.toggle('collapsed'); prefs.collapsed = document.body.classList.contains('collapsed'); savePrefs(); };
  document.getElementById('btn-settings').innerHTML = icon('settings');
  document.getElementById('btn-settings').onclick = () => HASH.v = '#/config/estudio';
  document.getElementById('search-ico').innerHTML = icon('search');
  document.getElementById('today-chip').textContent = `${WEEK[TODAY.getDay()]}, ${TODAY.getDate()} de ${MONTHS[TODAY.getMonth()]}`;
  document.getElementById('sidebar').addEventListener('click', e => { if (e.target.closest('.subnav a')) document.body.classList.remove('more-open'); });
  document.addEventListener('click', e => { if (document.body.classList.contains('more-open') && !e.target.closest('.sidebar') && !e.target.closest('.bottom-bar')) document.body.classList.remove('more-open'); });
  refreshShell(); setupSearch(); setupNew();
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (!a) return; e.preventDefault(); HASH.v = a.getAttribute('href'); });
  if (!HASH.v) HASH.v = '#/inicio'; else route();
})();
