import { NAV, NEWS, EVENTS, QUICK_LINKS, SITES, PERSONAS, LINES, AUDIENCES } from './engine/ia.mjs';
import { visibleFor, visibleNav, canOpenSite, validateAudiences, permissionMatrix } from './engine/audience.mjs';
import { checkTree, sampleTree, renamePlan } from './engine/precheck.mjs';
import { paletteFor, contrastChecks, powershell, isHex } from './engine/theme.mjs';
import { SAMPLE_CARRIERS, filterCarriers, lineCounts } from './engine/carriers.mjs';
import { FINDINGS, GROUPS } from './data/findings.mjs';
import * as fluent from './vendor/fluent-theme.mjs';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const h = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('en-US');
const plural = (n, one, many = one + 's') => `${nf.format(n)} ${n === 1 ? one : many}`;

const state = { persona: 'staff', page: 'home', line: '', q: '', dq: '', annot: false, palette: null };
const user = () => ({ type: 'member', groups: PERSONAS[state.persona].groups });

/* ── Sample content for the concept ───────────────────────── */
const DATES = { n1: 'Nov 16, 2026', n2: 'Nov 13, 2026', n3: 'Nov 12, 2026', n4: 'Nov 10, 2026', n5: 'Nov 9, 2026', n6: 'Nov 6, 2026' };
const FORMS = [
  ['Farm & ranch application', 'Heartland Farm Insurance', 'Farm & ranch', 'Nov 12'],
  ['Personal auto rate sheet, Q1 2027', 'North Star Casualty', 'Personal auto', 'Nov 10'],
  ['Commercial supplemental questionnaire', 'Red River Commercial', 'Commercial', 'Nov 4'],
  ['Life application and e-signature guide', 'Lakes Life & Annuity', 'Life & health', 'Oct 29'],
];
const CONTACTS = [
  ['AS', 'Agency Services', 'New business and policy questions'], ['LA', 'Licensing & appointments', 'Licenses, CE, carrier appointments'],
  ['MK', 'Marketing', 'Brand, ads, social posts'], ['AC', 'Accounting', 'Commissions and statements'],
  ['IT', 'IT help', 'Accounts, devices, Microsoft 365'], ['CR', 'Carrier relations', 'Carrier reps and new carriers'],
];
const PEOPLE = [
  ['Dana L.', 'Agent', 'Alexandria'], ['Chris B.', 'Agent', 'Detroit Lakes'], ['Pat O.', 'Agent', 'Marshall'],
  ['Robin S.', 'Agent', 'Elk River'], ['Jesse K.', 'Agent', 'Fergus Falls'], ['Alex N.', 'Agent', 'Roseau'],
  ['Taylor H.', 'Agency Services', 'State Office'], ['Jamie W.', 'Licensing', 'State Office'], ['Lee M.', 'Marketing', 'State Office'],
  ['Kerry V.', 'Accounting', 'State Office'], ['Shawn E.', 'Agent', 'Thief River Falls'], ['Reese A.', 'Agent', 'Lake Crystal'],
];
const ICONS = {
  'ql-carriers': '<path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6"/>',
  'ql-forms': '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  'ql-marketing': '<path d="M4 10v4h3l6 4V6l-6 4zM17 9a4 4 0 0 1 0 6"/>',
  'ql-training': '<rect x="3" y="5" width="18" height="13" rx="1"/><path d="m10 9 5 2.5-5 2.5z"/>',
  'ql-ams': '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  'ql-directory': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  'ql-publish': '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
  'ql-leadership': '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/>',
};
const LINK_PAGE = {
  'ql-carriers': 'carriers', 'ql-forms': 'carriers', 'ql-directory': 'directory',
  'ql-marketing': 'p:Marketing kit', 'ql-training': 'p:Training & webinars', 'ql-ams': 'p:Agency management system',
  'ql-publish': 'p:Publish a news post', 'ql-leadership': 'p:Leadership',
};
const NAV_PAGE = {
  'Home': 'home', 'All carriers': 'carriers', 'Carrier contacts': 'carriers', 'Underwriting guidelines': 'carriers',
  'Applications & forms': 'carriers', 'Staff & agent directory': 'directory', 'Key contacts': 'directory',
  'Office locations': 'directory', 'Calendar': 'calendar', 'All news': 'home',
};
const PLACEHOLDERS = {
  'Forms & templates': ['Document library with Document type and Department columns, filtered views per department.', 'M4'],
  'Marketing kit': ['Library of logos, social posts, print ads and email templates, each with a "Use until" date so expired material drops out of view. Agents see agent-approved items.', 'M4'],
  'Training & webinars': ['Recorded webinars and slide decks, played in the page, sorted by topic and line of business.', 'M4'],
  'Procedures': ['Procedures by department, each with an owner and a next-review date.', 'M4'],
  'Agent spotlights': ['News posts tagged Spotlight, shown as a carousel.', 'M4'],
  'Publish a news post': ['Publishers see "+ New > News post" with a branded news template. Everyone else never sees this link.', 'M2'],
  'Agency Operations': ['Private team site for State Office staff, connected to Teams, with the department\'s Outlook group calendar.', 'M4'],
  'Leadership': ['Private team site for leadership only: board materials, planning, the leadership calendar.', 'M4'],
  'Agency management system': ['A quick link to the system your agents already use. Link to come from you.', 'M2'],
};

/* ── Concept: navigation and mega menu ─────────────────────── */
function renderNav() {
  const nav = $('#sp-nav');
  const items = visibleNav(NAV, user());
  nav.innerHTML = items.map((n, i) => n.children
    ? `<button type="button" aria-expanded="false" aria-controls="sp-mega" data-i="${i}">${h(n.title)}</button>`
    : `<button type="button" data-go="${h(n.title)}"${pageOf(n.title) === state.page ? ' class="current" aria-current="page"' : ''}>${h(n.title)}</button>`).join('');
  $$('button', nav).forEach(b => b.addEventListener('click', () => {
    if (b.dataset.go) { closeMega(); go(pageOf(b.dataset.go)); return; }
    const open = b.getAttribute('aria-expanded') === 'true';
    closeMega();
    if (!open) openMega(b, items[+b.dataset.i]);
  }));
}
function pageOf(title) { return NAV_PAGE[title] || `p:${title}`; }
function openMega(btn, node) {
  const mega = $('#sp-mega');
  btn.setAttribute('aria-expanded', 'true');
  mega.innerHTML = `<h3>${h(node.title)}</h3><ul>${node.children.map(c =>
    `<li><button type="button" data-go="${h(c.title)}">${h(c.title)}</button></li>`).join('')}</ul>`;
  mega.hidden = false;
  $$('button', mega).forEach(b => b.addEventListener('click', () => { closeMega(); go(pageOf(b.dataset.go)); }));
  $('button', mega)?.focus();
}
function closeMega() {
  $('#sp-mega').hidden = true;
  $$('#sp-nav button[aria-expanded]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#sp-mega').hidden) {
    const open = $('#sp-nav button[aria-expanded="true"]');
    closeMega(); open?.focus();
  }
});
document.addEventListener('click', e => { if (!e.target.closest('.sp-header')) closeMega(); });

function go(page) {
  state.page = page;
  renderNav();
  renderPage();
  $('#sp-page').focus({ preventScroll: true });
}

/* ── Concept: pages ────────────────────────────────────────── */
const wp = (part, note, inner, tag = 'section') =>
  `<${tag} class="wp" data-wp="${h(part)}" data-note="${h(note)}">${inner}</${tag}>`;

function homePage() {
  const u = user();
  const news = visibleFor(NEWS, u);
  const links = visibleFor(QUICK_LINKS, u);
  const events = visibleFor(EVENTS, u);
  const aud = (a) => a.length ? `For ${a.map(id => AUDIENCES.find(x => x.id === id).name.replace('FUA ', '')).join(', ')}` : '';
  return `
  ${wp('Hero web part', 'Tiles layout, five links. Images and text are edited in place.', `
    <h2 class="sr-only">Featured</h2>
    <div class="hero">
      <a href="#" data-go="carriers" class="rows"><span>Carrier Resource Center: every carrier, form and rep in one place</span></a>
      <a href="#" data-go="p:Procedures" class="field"><span>Year-end licensing checklist</span></a>
      <a href="#" data-go="p:Marketing kit" class="contour"><span>Winter marketing kit is ready</span></a>
      <a href="#" data-go="calendar" class="sky"><span>Annual agents meeting: save the date</span></a>
      <a href="#" data-go="p:Agent spotlights" class="plain"><span>Welcome to our newest agents</span></a>
    </div>`)}
  <div class="sp-grid-2">
    ${wp('News web part', 'Source: this hub, set as the organization news site. Audience targeting on, so each person sees their posts.', `
      <h2>News</h2>
      <ul class="news">${news.map((n, i) => `<li><div class="thumb ${['rows', 'field', 'contour', 'sky'][i % 4]}" aria-hidden="true"></div><div>
        <span class="tag">${h(n.tag)}</span><a class="t" href="#" data-go="p:Agent spotlights">${h(n.title)}</a>
        <span class="meta">${DATES[n.id]}</span>${n.audiences.length ? ` <span class="tgt">Shown to: ${h(aud(n.audiences).replace('For ', ''))}</span>` : ''}</div></li>`).join('')}</ul>`)}
    ${wp('Quick links web part', 'Compact layout. Links for publishers and leadership are targeted to those groups.', `
      <h2>Quick links</h2>
      <ul class="ql">${links.map(l => `<li><button type="button" data-go="${h(LINK_PAGE[l.id])}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[l.id]}</svg><span>${h(l.title)}${l.placeholder ? ' <span class="ph">(your link)</span>' : ''}</span></button></li>`).join('')}</ul>`)}
  </div>
  <div class="sp-grid-2">
    ${wp('Highlighted content web part', 'Shows documents from the carrier libraries changed in the last 30 days, newest first.', `
      <h2>Forms updated this month</h2>
      <div class="scroll-x"><table class="hc"><thead><tr><th>Name</th><th>Carrier</th><th>Line</th><th>Updated</th></tr></thead><tbody>
      ${FORMS.map(f => `<tr><td><span class="doc-ico" aria-hidden="true"></span>${h(f[0])}</td><td>${h(f[1])}</td><td>${h(f[2])}</td><td>${h(f[3])}</td></tr>`).join('')}
      </tbody></table></div>`)}
    ${wp('Events web part', 'Reads the Events list on this hub, next four events, with audience targeting. "Add to my calendar" downloads to Outlook.', `
      <h2>Events</h2>${eventsList(events)}`)}
  </div>
  <div style="margin-top:28px">
  ${wp('People web part', 'Key contacts, read from Microsoft 365 profiles so titles and phone numbers stay current.', `
    <h2>Key contacts</h2>
    <ul class="people">${CONTACTS.map(c => `<li><span class="pic" aria-hidden="true">${c[0]}</span><span><span class="n">${h(c[1])}</span><br><span class="r">${h(c[2])}</span></span></li>`).join('')}</ul>`)}
  </div>`;
}

function eventsList(events) {
  const fmt = (d) => new Date(d + 'T12:00:00');
  return `<ul class="ev">${events.map(e => {
    const d = fmt(e.date);
    return `<li><span class="d" aria-hidden="true"><b>${d.getDate()}</b><small>${d.toLocaleString('en-US', { month: 'short' })}</small></span>
      <span><span class="t">${h(e.title)}</span><br><span class="meta">${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></span></li>`;
  }).join('')}</ul>`;
}

function carriersPage() {
  const list = filterCarriers(SAMPLE_CARRIERS, { line: state.line, q: state.q });
  const counts = lineCounts(SAMPLE_CARRIERS);
  return `
  <h2>Carrier Resource Center</h2>
  <p class="sp-note" style="margin:0 0 12px">Every carrier is one list item, tagged by line of business, so a carrier that writes farm and auto shows up under both. Sample carriers.</p>
  ${wp('List web part', 'Shows the Carriers list. Filter buttons use the indexed "Lines of business" column; search covers carrier, line and rep.', `
    <div class="filters" role="group" aria-label="Filter by line of business">
      <button type="button" class="chip" data-line="" aria-pressed="${state.line === ''}">All (${SAMPLE_CARRIERS.length})</button>
      ${LINES.map(l => `<button type="button" class="chip" data-line="${h(l)}" aria-pressed="${state.line === l}">${h(l)} (${counts[l]})</button>`).join('')}
    </div>
    <label class="sr-only" for="cr-q">Search carriers</label>
    <input class="sp-input" id="cr-q" type="search" placeholder="Search carrier, line or rep" value="${h(state.q)}">
    <div class="scroll-x"><table class="splist"><caption class="sr-only">Carriers</caption>
      <thead><tr><th scope="col">Carrier</th><th scope="col">Lines of business</th><th scope="col">Rep</th><th scope="col">Rep phone</th><th scope="col">Guides</th><th scope="col">Forms</th><th scope="col"><span class="sr-only">Portal</span></th></tr></thead>
      <tbody id="cr-rows">${carrierRows(list)}</tbody></table></div>
    <p class="sp-note" id="cr-count" aria-live="polite">${list.length} of ${SAMPLE_CARRIERS.length} carriers</p>`)}`;
}
function carrierRows(list) {
  if (!list.length) return '<tr><td colspan="7">No carrier matches. Try another line or a shorter search.</td></tr>';
  return list.map(c => `<tr><td><b>${h(c.name)}</b></td><td><div class="lines">${c.lines.map(l => `<span>${h(l)}</span>`).join('')}</div></td>
    <td>${h(c.rep)}</td><td>${h(c.phone)}</td><td>${c.guides}</td><td>${c.forms}</td>
    <td><button type="button" class="sp-btn" disabled title="Sample carrier">Open portal</button></td></tr>`).join('');
}

function directoryPage() {
  const q = state.dq.trim().toLowerCase();
  const rows = PEOPLE.filter(p => !q || p.some(v => v.toLowerCase().includes(q)));
  return `
  <h2>Staff & agent directory</h2>
  ${wp('People search (directory page)', 'Search runs on Microsoft 365 profiles: name, job title, office, phone. Blank titles in Entra show up blank here, so profiles get cleaned up in the build.', `
    <label class="sr-only" for="dr-q">Search people</label>
    <input class="sp-input" id="dr-q" type="search" placeholder="Search name, role or office" value="${h(state.dq)}">
    <ul class="people" id="dr-list" style="margin-top:14px">${peopleItems(rows)}</ul>
    <p class="sp-note" id="dr-count" aria-live="polite">${rows.length} people. Sample entries; offices are real Farmers Union Agency towns.</p>`)}`;
}
function peopleItems(rows) {
  if (!rows.length) return '<li>No one matches. Try a town or a role.</li>';
  return rows.map(p => `<li><span class="pic" aria-hidden="true">${p[0].split(' ').map(x => x[0]).join('')}</span>
    <span><span class="n">${h(p[0])}</span><br><span class="r">${h(p[1])}, ${h(p[2])}</span></span></li>`).join('');
}

function calendarPage() {
  const events = visibleFor(EVENTS, user());
  return `
  <h2>Calendar</h2>
  <div class="sp-grid-2" style="margin-top:0">
    ${wp('Events web part (full page)', 'All upcoming events from the hub Events list, filtered by audience.', eventsList(events))}
    ${wp('Group calendar web part', 'On each department team site: that team\'s Outlook calendar, up to 10 events. It needs a Microsoft 365 group, which the hub does not have.', `
      <h2>Department calendars</h2>
      <p class="sp-note" style="margin-top:0">Agency Operations and Leadership each keep their Outlook group calendar on their own team site. Company-wide dates live here.</p>`, 'aside')}
  </div>`;
}

function placeholderPage(title) {
  const [text, m] = PLACEHOLDERS[title] || ['Part of the build.', 'M3'];
  return `<h2>${h(title)}</h2><p>${h(text)}</p><p class="sp-note">Not drawn in this concept. Built in milestone ${m}.</p>`;
}

function renderPage() {
  const page = $('#sp-page');
  const p = state.page;
  page.innerHTML = p === 'home' ? homePage() : p === 'carriers' ? carriersPage()
    : p === 'directory' ? directoryPage() : p === 'calendar' ? calendarPage() : placeholderPage(p.slice(2));
  addTags(page);
  $$('[data-go]', page).forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.go); }));
  if (p === 'carriers') {
    $$('.chip', page).forEach(c => c.addEventListener('click', () => { state.line = c.dataset.line; renderPage(); $(`.chip[data-line="${CSS.escape(state.line)}"]`)?.focus(); }));
    $('#cr-q').addEventListener('input', e => {
      state.q = e.target.value;
      const list = filterCarriers(SAMPLE_CARRIERS, { line: state.line, q: state.q });
      $('#cr-rows').innerHTML = carrierRows(list);
      $('#cr-count').textContent = `${list.length} of ${SAMPLE_CARRIERS.length} carriers`;
    });
  }
  if (p === 'directory') {
    $('#dr-q').addEventListener('input', e => {
      state.dq = e.target.value;
      const q = state.dq.trim().toLowerCase();
      const rows = PEOPLE.filter(x => !q || x.some(v => v.toLowerCase().includes(q)));
      $('#dr-list').innerHTML = peopleItems(rows);
      $('#dr-count').textContent = `${rows.length} people. Sample entries; offices are real Farmers Union Agency towns.`;
    });
  }
}

function addTags(root) {
  $$('.wp', root).forEach(el => {
    if (el.querySelector(':scope > .wp-tag')) return;
    const t = document.createElement('span');
    t.className = 'wp-tag';
    t.innerHTML = `${h(el.dataset.wp)}<small>${h(el.dataset.note)}</small>`;
    el.prepend(t);
  });
}

function personaHint() {
  const u = user();
  const n = visibleFor(NEWS, u).length, l = visibleFor(QUICK_LINKS, u).length, e = visibleFor(EVENTS, u).length;
  const dept = visibleNav(NAV, u).some(x => x.title === 'Departments');
  $('#persona-hint').textContent = `${PERSONAS[state.persona].label}: ${n} of ${NEWS.length} news posts, ${l} of ${QUICK_LINKS.length} quick links, ${e} of ${EVENTS.length} events${dept ? '' : ', no Departments menu'}.`;
  $('#sp-avatar').textContent = { staff: 'SO', agent: 'AG', leader: 'LD' }[state.persona];
}

$$('#persona input').forEach(r => r.addEventListener('change', () => {
  state.persona = r.value;
  // If the page on screen is behind a menu link this role can't see, go home.
  const flat = (nodes) => nodes.flatMap(n => [n.title, ...(n.children ? flat(n.children) : [])]);
  const all = new Set(flat(NAV)), seen = new Set(flat(visibleNav(NAV, user())));
  const t = state.page.startsWith('p:') ? state.page.slice(2) : null;
  if (t && all.has(t) && !seen.has(t)) state.page = 'home';
  if (t === 'Leadership' && !user().groups.includes('leaders')) state.page = 'home';
  if (t === 'Publish a news post' && !user().groups.includes('publishers')) state.page = 'home';
  renderNav(); renderPage(); personaHint(); renderAccess();
}));
$('#annot').addEventListener('change', e => { $('#sp').classList.toggle('annot', e.target.checked); addTags(document); });

/* ── Tabs ─────────────────────────────────────────────────── */
const tabs = $$('[role="tab"]');
function selectTab(t, focus = true) {
  tabs.forEach(x => {
    const on = x === t;
    x.setAttribute('aria-selected', on);
    x.tabIndex = on ? 0 : -1;
    $(`#${x.getAttribute('aria-controls')}`).hidden = !on;
  });
  if (focus) t.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length]); }
    if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0]); }
    if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1]); }
  });
});

/* ── Content move check ───────────────────────────────────── */
const PROBLEMS = {
  path_too_long: ['Path over 400 characters', 'The entire decoded path, including the file name, can\'t exceed 400 characters.'],
  invalid_char: ['Character SharePoint refuses', 'Names can\'t contain " * : < > ? / \\ |'],
  edge_space: ['Starts or ends with a space', 'Leading and trailing spaces aren\'t allowed.'],
  reserved_name: ['Reserved name', '.lock, CON, PRN, AUX, NUL, COM0-9, LPT0-9 and desktop.ini aren\'t allowed.'],
  tilde_dollar: ['Office lock file (~$)', 'Names starting with ~$ aren\'t allowed. These are leftovers; leave them behind.'],
  vti: ['Contains _vti_', '_vti_ can\'t appear anywhere in a name.'],
  root_forms: ['"Forms" folder at library root', '"forms" isn\'t supported as a folder at the root of a library.'],
  file_too_big: ['File over 250 GB', 'The per-file limit is 250 GB.'],
  caution_char: ['Contains # or %', 'Some organizations don\'t yet support # and %.'],
  reserved_stem: ['Windows-reserved name with an extension (CON.docx)', 'May be refused, and won\'t sync to Windows PCs. Rename to be safe.'],
  trailing_period: ['Ends with a period', 'Windows drops a trailing period, so these fail to sync.'],
  blocked_type: ['Temporary or system file', '.tmp and .DS_Store files are not uploaded.'],
  long_segment: ['Name over 255 characters', 'Won\'t sync to a PC or Mac.'],
  over_threshold: ['Folder over 5,000 items', 'Views over the List View Threshold need indexed filters.'],
};
let lastResult = null;
function runMove(files, label) {
  const target = $('#mv-target').value.trim().replace(/^\/+|\/+$/g, '') || 'sites/fua-resources/Forms';
  const t0 = performance.now();
  const r = checkTree(files, { target });
  const ms = Math.round(performance.now() - t0);
  lastResult = r;
  const order = Object.keys(PROBLEMS);
  const codes = Object.keys(r.byCode).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const rows = codes.map(c => {
    const first = r.issues.find(i => i.code === c);
    const sev = first.severity === 'error' ? '<span class="pill bad">Must fix</span>' : '<span class="pill warn">Review</span>';
    // Make leading/trailing spaces in any segment visible.
    const shown = first.path.split('/').map(seg => seg.replace(/^ +| +$/g, m => '\u2423'.repeat(m.length))).join('/');
    const ex = shown.length > 90 ? shown.slice(0, 40) + ' ... ' + shown.slice(-44) : shown;
    return `<tr><td>${sev}</td><td><b>${h(PROBLEMS[c][0])}</b><br><span class="muted">${h(PROBLEMS[c][1])}</span></td><td>${r.byCode[c]}</td><td><code>${h(ex)}</code></td></tr>`;
  }).join('');
  $('#mv-out').innerHTML = `
    <p class="summary">${h(label)}: <b>${plural(r.files, 'file')}</b> in <b>${plural(r.folders, 'folder')}</b>.
      <b>${r.errors}</b> must be fixed before the move, <b>${r.warnings}</b> to review. Longest path: ${r.maxPath} characters. Checked in ${ms} ms.</p>
    ${rows ? `<div class="scroll-x"><table class="data"><caption class="sr-only">Problems found</caption><thead><tr><th scope="col">Action</th><th scope="col">Problem</th><th scope="col">Count</th><th scope="col">First example</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="row"><button class="btn" id="mv-csv">Download rename plan (.csv)</button><span class="muted">Each item to rename, with a suggested name, or marked to leave behind.</span></div>`
    : '<p class="verdict yes">Nothing SharePoint would refuse. This folder can move as it is.</p>'}`;
  $('#mv-csv')?.addEventListener('click', () => download('rename-plan.csv', renamePlan(lastResult), 'text/csv'));
}
$('#mv-sample').addEventListener('click', () => runMove(sampleTree(), 'Sample drive'));
$('#mv-folder').addEventListener('change', e => {
  const list = [...e.target.files];
  if (!list.length) return;
  // The chosen folder becomes the library, so its own name is dropped from each path.
  const files = list.map(f => ({ path: (f.webkitRelativePath || f.name).split('/').slice(1).join('/') || f.name, size: f.size }));
  runMove(files, `Your folder "${(list[0].webkitRelativePath || '').split('/')[0] || 'selection'}"`);
});

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Theme ────────────────────────────────────────────────── */
const PAIR_USE = { button: 'White text on buttons and the site header', 'button-hover': 'Button when hovered', link: 'Links and web part titles',
  'link-tint': 'Text on a soft tinted section', body: 'Body text', secondary: 'Dates, bylines, secondary text' };
function applyTheme(hex) {
  if (!isHex(hex)) { $('#th-err').textContent = 'Use six-digit hex, like #2f6b3a.'; return; }
  $('#th-err').textContent = '';
  const p = paletteFor(hex.toLowerCase(), fluent);
  state.palette = p;
  const sp = $('#sp');
  for (const [k, v] of Object.entries(p)) sp.style.setProperty(`--${k}`, v);
  const slots = ['themeLighterAlt', 'themeLighter', 'themeLight', 'themeTertiary', 'themeSecondary', 'themePrimary', 'themeDarkAlt', 'themeDark', 'themeDarker'];
  $('#th-swatches').innerHTML = slots.map(k => `<div><span class="chip-c" style="background:${p[k]}"></span><small>${k.replace('theme', '')}<br>${p[k]}</small></div>`).join('');
  const checks = contrastChecks(p);
  $('#th-table').innerHTML = `<caption class="sr-only">Contrast checks</caption><thead><tr><th scope="col">Where it shows</th><th scope="col">Sample</th><th scope="col">Contrast</th><th scope="col">Result</th></tr></thead><tbody>${checks.map(c =>
    `<tr><td>${h(PAIR_USE[c.id])}</td><td><span class="pair" style="color:${c.fgHex};background:${c.bgHex}">Aa Carrier forms</span></td><td>${c.ratio.toFixed(2)}:1</td>
     <td>${c.pass ? '<span class="pill good">Passes 4.5:1</span>' : '<span class="pill bad">Below 4.5:1</span>'}</td></tr>`).join('')}</tbody>`;
  const raw = contrastChecks(paletteFor(hex.toLowerCase(), fluent, { neutrals: 'generated' })).find(c => c.id === 'secondary');
  const fail = checks.filter(c => !c.pass).length;
  $('#th-neutral').textContent = `${fail ? `${fail} pair${fail > 1 ? 's' : ''} below 4.5:1 with this color: a darker shade of your brand color usually fixes it. ` : ''}`
    + `Straight from the generator, secondary text would be ${raw.ratio.toFixed(2)}:1, so the palette keeps Fluent's default neutral colors.`;
  $('#th-pick').value = hex.toLowerCase();
}
$('#th-hex').addEventListener('input', e => {
  const v = e.target.value.trim();
  if (isHex(v)) applyTheme(v);
  else $('#th-err').textContent = (v.length >= 7 || (v && !v.startsWith('#'))) ? 'Use six-digit hex, like #2f6b3a.' : '';
});
$('#th-pick').addEventListener('input', e => { $('#th-hex').value = e.target.value; applyTheme(e.target.value); });
$('#th-ps').addEventListener('click', () => download('farmers-union-agency-theme.ps1', powershell('Farmers Union Agency', state.palette) + '\n', 'text/plain'));
$('#th-json').addEventListener('click', async () => {
  const text = JSON.stringify(state.palette, null, 2);
  try { await navigator.clipboard.writeText(text); $('#th-copied').textContent = 'Copied.'; }
  catch { download('farmers-union-agency-palette.json', text, 'application/json'); $('#th-copied').textContent = 'Downloaded instead.'; }
});

/* ── Access ───────────────────────────────────────────────── */
function renderAccess() {
  const m = permissionMatrix(SITES, PERSONAS);
  const cell = { edit: '<span class="pill good">Can edit</span>', read: '<span class="pill none">Can read</span>', none: '<span class="pill bad">No access</span>' };
  $('#ac-matrix').innerHTML = `<caption class="sr-only">Access by role</caption><thead><tr><th scope="col">Site</th>${Object.values(PERSONAS).map(p => `<th scope="col">${h(p.label)}</th>`).join('')}</tr></thead>
    <tbody>${m.map(r => `<tr><th scope="row" style="text-align:left;font-weight:600">${h(r.site)}</th>${Object.keys(PERSONAS).map(k => `<td>${cell[r.cells[k]]}</td>`).join('')}</tr>`).join('')}</tbody>`;
  const acct = $('input[name="ac-acct"]:checked').value;
  const share = $('input[name="ac-share"]:checked').value;
  const home = SITES.find(s => s.key === 'home');
  const ok = canOpenSite({ ...home, access: share === 'EEEU' ? 'EEEU' : home.access }, { type: acct, groups: ['agents'] });
  const v = $('#ac-verdict');
  v.className = `verdict ${ok ? 'yes' : 'no'}`;
  v.textContent = ok
    ? (acct === 'guest' ? 'The agent gets in: sharing with the FUA Agents group includes guests you add to it.' : 'The agent gets in.')
    : 'The agent is refused. "Everyone except external users" never includes guest accounts, so this agent sees an access-denied page.';
  const refs = validateAudiences();
  $('#ac-aud').textContent = refs.valid
    ? `Every audience on menus, news, quick links, events and site access points at one of four Entra groups (${AUDIENCES.map(a => a.name).join(', ')}). SharePoint groups can't be used as audiences in modern SharePoint, so none are.`
    : `Problems: ${refs.problems.map(p => p.ref).join(', ')}`;
}
$$('input[name="ac-acct"], input[name="ac-share"]').forEach(r => r.addEventListener('change', renderAccess));

/* ── Findings ─────────────────────────────────────────────── */
$('#fd-list').innerHTML = GROUPS.map(g => `<h3 class="group-h">${h(g.title)}</h3><ul class="findings">${FINDINGS.filter(f => f.group === g.id).map(f => `
  <li><h4>${h(f.title)}</h4><p>${h(f.detail)}</p><p class="fix">${h(f.fix)}</p>
  <p class="src">${f.src.length ? f.src.map(([t, u]) => `<a href="${h(u)}" rel="noopener" target="_blank">${h(t)}</a>`).join('; ') : 'Measured on this page.'}</p></li>`).join('')}</ul>`).join('');

/* ── Results-driven text ──────────────────────────────────── */
async function loadResults() {
  let r;
  try { r = await (await fetch('data/results.json')).json(); } catch { return; }
  $('#pf-tests').textContent = `${r.tests.pass} of ${r.tests.pass + r.tests.fail}`;
  if (r.mutations) $('#pf-mut').textContent = `${r.mutations.caught} of ${r.mutations.total}`;
  $('#pf-xsd').textContent = r.template.validates ? 'Validates' : 'Fails';
  $('#pf-drive').textContent = `${nf.format(r.precheck.files)} files`;
  const t = r.template;
  $('#tp-stats').innerHTML = [
    `${t.siteCollections} sites: the hub, Carrier Resource Center, Agent & Employee Resources, and two private team sites`,
    `${t.lists} lists and libraries with ${t.fields} columns, filter columns indexed`,
    `${t.navNodes} menu links in the mega menu, with audiences`,
    `A ${t.webParts}-part homepage, and your theme`,
  ].map(x => `<li>${h(x)}</li>`).join('');
  $('#tp-valid').innerHTML = t.validates
    ? `<span class="pill good">Validates</span> against the ${h(t.schema)} with xmllint. A test also proves the check is real: a misspelled web part type makes it fail.`
    : '<span class="pill bad">Does not validate</span>';
  $('#tp-creates').innerHTML = ['Five sites, joined to the hub', 'Hub mega menu with audience targeting on', 'Carriers list, Events list, Offices list',
    'Underwriting, Applications, Forms, Marketing, Training and Procedures libraries', 'Homepage layout with the six web parts above', 'Your theme, applied to every site',
    'Access for the four Entra groups'].map(x => `<li>${h(x)}</li>`).join('');
  $('#ms-yes').innerHTML = [
    `${r.tests.pass} of ${r.tests.pass + r.tests.fail} tests pass: the content check, audiences and access, theme contrast, the template, carrier filters.`,
    r.mutations ? `${r.mutations.caught} of ${r.mutations.total} planted bugs caught by those tests.` : null,
    `The site template validates against the PnP Provisioning Schema 2022/09 (xmllint); schema file SHA-256 ${t.schemaSha256.slice(0, 12)}...`,
    `Sample shared drive: ${nf.format(r.precheck.files)} files, ${r.precheck.errors} must-fix and ${r.precheck.warnings} review items found, longest path ${r.precheck.maxPath} characters.`,
    `Placeholder theme: all ${r.theme.checks.length} contrast pairs pass 4.5:1; raw generated neutrals would give ${r.theme.generatedSecondary}:1.`,
    'Every audience reference points at an Entra group; agents never see leadership content in the concept.',
  ].filter(Boolean).map(x => `<li>${h(x)}</li>`).join('');
}
$('#tp-cmd').textContent = [
  '# PnP PowerShell, signed in as a Global Administrator',
  'Connect-PnPOnline -Url https://<tenant>-admin.sharepoint.com -Interactive -ClientId <your-app-id>',
  'Invoke-PnPTenantTemplate -Path .\\fua-intranet.xml -Parameters @{',
  '  IntranetOwner = "<owner email>"; GroupAgents = "FUA Agents"',
  '}',
].join('\n');

/* ── Start ────────────────────────────────────────────────── */
renderNav(); renderPage(); addTags(document); personaHint(); renderAccess(); applyTheme('#2f6b3a'); loadResults();
window.__ready = true;
