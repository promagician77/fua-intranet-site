// Who sees what: audience targeting and site access, as SharePoint evaluates them.
import { AUDIENCES, audienceRefs } from './ia.mjs';

const ENTRA_KINDS = new Set(['security', 'm365', 'dynamic']);

/** An item with no audiences is shown to everyone; otherwise to members of any listed group. */
export function isTargetedTo(item, user) {
  if (!item.audiences || item.audiences.length === 0) return true;
  return item.audiences.some(a => user.groups.includes(a));
}

/** Filter a flat list of targeted items for one user. */
export function visibleFor(items, user) {
  return items.filter(i => isTargetedTo(i, user));
}

/** Filter navigation recursively; a parent with no visible children and no URL disappears. */
export function visibleNav(nodes, user) {
  const out = [];
  for (const n of nodes) {
    if (!isTargetedTo(n, user)) continue;
    if (n.children) {
      const kids = visibleNav(n.children, user);
      if (kids.length === 0 && !n.url) continue;
      out.push({ ...n, children: kids });
    } else {
      out.push(n);
    }
  }
  return out;
}

/**
 * Can this user open the site?
 * access: array of Entra group ids, or the string 'EEEU' ("Everyone except external users").
 * EEEU covers every internal account and no guest account.
 */
export function canOpenSite(site, user) {
  if (site.access === 'EEEU') return user.type === 'member';
  return site.access.some(g => user.groups.includes(g));
}

/**
 * Check every audience reference: it must point to an Entra group (security, Microsoft 365
 * or dynamic). SharePoint groups cannot be used as audiences in modern targeting.
 */
export function validateAudiences(refs = audienceRefs(), audiences = AUDIENCES) {
  const byId = new Map(audiences.map(a => [a.id, a]));
  const problems = [];
  for (const r of new Set(refs)) {
    const a = byId.get(r);
    if (!a) problems.push({ ref: r, problem: 'unknown_audience' });
    else if (!ENTRA_KINDS.has(a.kind)) problems.push({ ref: r, problem: `not_an_entra_group:${a.kind}` });
  }
  return { valid: problems.length === 0, problems };
}

/** Permission matrix: rows = sites, columns = personas, cells = 'edit' | 'read' | 'none'. */
export function permissionMatrix(sites, personas, accountType = 'member') {
  return sites.map(site => {
    const row = { site: site.title, cells: {} };
    for (const [key, p] of Object.entries(personas)) {
      const user = { type: accountType, groups: p.groups };
      const read = canOpenSite(site, user);
      const edit = read && site.editors.some(g => user.groups.includes(g));
      row.cells[key] = edit ? 'edit' : read ? 'read' : 'none';
    }
    return row;
  });
}
