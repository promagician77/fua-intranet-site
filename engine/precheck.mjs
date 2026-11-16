// Pre-migration check: finds files and folders SharePoint in Microsoft 365 will refuse,
// before anything is uploaded. Rules follow Microsoft's "Restrictions and limitations in
// OneDrive and SharePoint" (support.microsoft.com/help/3125202) and the List View Threshold.

export const LIMITS = {
  pathMax: 400,                    // entire decoded path incl. file name, site-relative
  segmentSync: 255,                // one file or folder name, when synced to a PC or Mac
  fileMaxBytes: 250 * 1024 ** 3,   // 250 GB per file
  viewThreshold: 5000,             // List View Threshold, per view / folder
  windowsPath: 260,                // classic Windows path limit on a synced PC (local path)
};

export const INVALID_CHARS = ['"', '*', ':', '<', '>', '?', '/', '\\', '|'];
export const CAUTION_CHARS = ['#', '%'];   // "Some organizations don't yet support # and %"
const RESERVED = new Set(['.lock', 'con', 'prn', 'aux', 'nul', 'desktop.ini',
  ...Array.from({ length: 10 }, (_, i) => `com${i}`),
  ...Array.from({ length: 10 }, (_, i) => `lpt${i}`)]);
const BLOCKED_EXT = new Set(['.tmp', '.ds_store']);

const SEV = { error: 'error', warn: 'warn' };

/** Check one file or folder name. Returns an array of { code, severity, detail }. */
export function checkName(name, { isFolder = false, isRootFolder = false } = {}) {
  const issues = [];
  const bad = [...new Set([...name].filter(c => INVALID_CHARS.includes(c)))];
  if (bad.length) issues.push({ code: 'invalid_char', severity: SEV.error, detail: `contains ${bad.join(' ')}` });
  const caution = [...new Set([...name].filter(c => CAUTION_CHARS.includes(c)))];
  if (caution.length) issues.push({ code: 'caution_char', severity: SEV.warn, detail: `contains ${caution.join(' ')}` });
  if (/^\s|\s$/.test(name)) issues.push({ code: 'edge_space', severity: SEV.error, detail: 'starts or ends with a space' });
  if (/\.$/.test(name)) issues.push({ code: 'trailing_period', severity: SEV.warn, detail: 'ends with a period' });

  const lower = name.toLowerCase();
  const stem = lower.includes('.') && !lower.startsWith('.') ? lower.slice(0, lower.indexOf('.')) : lower;
  if (RESERVED.has(lower)) issues.push({ code: 'reserved_name', severity: SEV.error, detail: `"${name}" is a reserved name` });
  else if (RESERVED.has(stem)) issues.push({ code: 'reserved_stem', severity: SEV.warn, detail: `"${stem.toUpperCase()}" is reserved on Windows` });
  if (lower.includes('_vti_')) issues.push({ code: 'vti', severity: SEV.error, detail: 'contains _vti_' });
  if (lower.startsWith('~$')) issues.push({ code: 'tilde_dollar', severity: SEV.error, detail: 'starts with ~$ (Office lock file)' });
  if (isFolder && isRootFolder && lower === 'forms') issues.push({ code: 'root_forms', severity: SEV.error, detail: '"forms" is reserved at a library root' });
  if (!isFolder) {
    const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : '';
    if (BLOCKED_EXT.has(ext) || lower === '.ds_store') issues.push({ code: 'blocked_type', severity: SEV.warn, detail: `${ext || name} files are not uploaded` });
  }
  if (name.length > LIMITS.segmentSync) issues.push({ code: 'long_segment', severity: SEV.warn, detail: `${name.length} characters (over 255 won't sync)` });
  return issues;
}

/** Suggested safe name: invalid characters → "-", trimmed, no trailing period, no ~$. */
export function suggestName(name) {
  let s = name;
  for (const c of INVALID_CHARS) s = s.split(c).join('-');
  for (const c of CAUTION_CHARS) s = s.split(c).join(c === '#' ? 'No.' : 'pct');
  s = s.replace(/^\s+|\s+$/g, '').replace(/\.+$/, '');
  if (s.startsWith('~$')) s = s.slice(2);
  s = s.replace(/_vti_/gi, '_vti-');
  const lower = s.toLowerCase();
  const stem = lower.includes('.') && !lower.startsWith('.') ? lower.slice(0, lower.indexOf('.')) : lower;
  if (RESERVED.has(lower)) s = `${s}-file`;
  else if (RESERVED.has(stem)) { const dot = s.indexOf('.'); s = `${s.slice(0, dot)}-file${s.slice(dot)}`; }
  return s || 'unnamed';
}

/**
 * Check a whole tree.
 * @param {{path:string, size?:number}[]} files  relative paths, "/" separated
 * @param {{target?:string}} opts  site-relative destination, e.g. "sites/fua-resources/Forms"
 */
export function checkTree(files, { target = 'sites/fua-resources/Forms' } = {}) {
  const issues = [];
  const folders = new Map();      // folder path -> direct child count
  const seenFolder = new Set();
  let maxPath = 0, maxPathItem = '';

  const add = (path, kind, list) => list.forEach(i => issues.push({ path, kind, ...i }));

  for (const f of files) {
    const parts = f.path.split('/').filter(Boolean);
    // folders along the way
    for (let d = 0; d < parts.length - 1; d++) {
      const fp = parts.slice(0, d + 1).join('/');
      const parent = parts.slice(0, d).join('/');
      if (!seenFolder.has(fp)) {
        seenFolder.add(fp);
        folders.set(parent, (folders.get(parent) || 0) + 1);
        add(fp, 'folder', checkName(parts[d], { isFolder: true, isRootFolder: d === 0 }));
      }
    }
    const parent = parts.slice(0, -1).join('/');
    folders.set(parent, (folders.get(parent) || 0) + 1);
    const name = parts[parts.length - 1];
    add(f.path, 'file', checkName(name));

    const full = `${target}/${parts.join('/')}`;
    if (full.length > maxPath) { maxPath = full.length; maxPathItem = f.path; }
    if (full.length > LIMITS.pathMax) {
      issues.push({ path: f.path, kind: 'file', code: 'path_too_long', severity: SEV.error,
        detail: `${full.length} characters after the site address (limit 400)` });
    }
    if (typeof f.size === 'number' && f.size > LIMITS.fileMaxBytes) {
      issues.push({ path: f.path, kind: 'file', code: 'file_too_big', severity: SEV.error, detail: 'over 250 GB' });
    }
  }
  for (const [folder, count] of folders) {
    if (count > LIMITS.viewThreshold) {
      issues.push({ path: folder || '(library root)', kind: 'folder', code: 'over_threshold', severity: SEV.warn,
        detail: `${count} items in one folder (views over 5,000 need indexed filters)` });
    }
  }
  const byCode = {};
  for (const i of issues) byCode[i.code] = (byCode[i.code] || 0) + 1;
  const errors = issues.filter(i => i.severity === 'error').length;
  return {
    files: files.length, folders: seenFolder.size, issues, byCode,
    errors, warnings: issues.length - errors, maxPath, maxPathItem, target,
  };
}

/** Items to leave out of the move entirely (system and temp files). */
function excluded(issues, path) {
  const name = path.split('/').pop().toLowerCase();
  return name === 'desktop.ini' || issues.some(i => i.path === path && ['tilde_dollar', 'blocked_type'].includes(i.code));
}

/** Rename plan as CSV: one row per item to rename or exclude. */
export function renamePlan(result) {
  const rows = [['Kind', 'Current path', 'Action', 'New name', 'Reason']];
  const done = new Set();
  for (const i of result.issues) {
    if (['path_too_long', 'over_threshold', 'file_too_big'].includes(i.code)) continue;
    if (done.has(i.path)) continue;
    done.add(i.path);
    const name = i.path.split('/').pop();
    const reasons = result.issues.filter(x => x.path === i.path).map(x => x.detail).join('; ');
    const skip = excluded(result.issues, i.path);
    const rootForms = result.issues.some(x => x.path === i.path && x.code === 'root_forms');
    const newName = skip ? '' : rootForms ? `${name} folder` : suggestName(name);
    rows.push([i.kind, i.path, skip ? 'Exclude' : 'Rename', newName, reasons]);
  }
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

/** Deterministic sample: a shared drive like many agencies have, with realistic problems. */
export function sampleTree(seed = 7) {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const carriers = ['Prairie Mutual', 'North Star Casualty', 'Heartland Farm Insurance', 'Lakes Life & Annuity', 'Red River Commercial', 'Plains Crop Partners'];
  const kinds = ['Applications', 'Underwriting Guidelines', 'Rate Sheets', 'Brochures'];
  const years = ['2023', '2024', '2025', '2026'];
  const files = [];
  for (let n = 0; n < 1180; n++) {
    const c = pick(carriers), k = pick(kinds), y = pick(years);
    files.push({ path: `Carriers/${c}/${k}/${y}/${c} ${k.replace(/s$/, '')} ${n}.pdf`, size: 200000 });
  }
  for (let n = 0; n < 240; n++) files.push({ path: `Marketing/Social Posts/${pick(years)}/Post ${n}.png`, size: 90000 });
  for (let n = 0; n < 160; n++) files.push({ path: `Training/Webinars/Session ${n}.mp4`, size: 80_000_000 });
  for (let n = 0; n < 5200; n++) files.push({ path: `Scans/Inbox/scan_${String(n).padStart(5, '0')}.pdf`, size: 300000 });
  // Planted problems seen on real shared drives
  files.push(
    { path: 'Carriers/Prairie Mutual/Applications/2026/Farm app - Smith?.pdf' },
    { path: 'Carriers/North Star Casualty/Rate Sheets/2026/Rates: Q1 vs Q2.xlsx' },
    { path: 'Carriers/North Star Casualty/Rate Sheets/2026/~$Rates Q1.xlsx' },
    { path: 'Marketing/Logos/desktop.ini' },
    { path: 'Marketing/Logos /FUA logo FINAL.png' },
    { path: 'Marketing/Ads/Fall ad #2 (50% off).pdf' },
    { path: 'Forms/W-9 request.docx' },
    { path: 'Procedures/Licensing/CON.docx' },
    { path: 'Procedures/Licensing/AUX notes.txt' },
    { path: 'Procedures/_vti_backup/old index.htm' },
    { path: 'Training/Webinars/notes.tmp' },
    { path: 'Training/Webinars/Q&A recap.' },
    { path: `Carriers/Heartland Farm Insurance/Underwriting Guidelines/2025/${'Archived submissions for review by the underwriting committee '.repeat(3).trim()}/${'Supplemental questionnaire for confinement livestock operations '.repeat(2)}.pdf` },
  );
  return files;
}
