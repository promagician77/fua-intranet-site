// Carrier Resource Center: one list item per carrier, filtered by line of business.
// Sample carriers are invented for the concept; the real list imports from a spreadsheet.
import { LINES } from './ia.mjs';

export const SAMPLE_CARRIERS = [
  { name: 'Prairie Mutual', lines: ['Home', 'Farm & ranch', 'Personal auto'], rep: 'Jordan M.', phone: '(555) 010-2201', guides: 4, forms: 18 },
  { name: 'North Star Casualty', lines: ['Personal auto', 'Home'], rep: 'Casey R.', phone: '(555) 010-2202', guides: 3, forms: 11 },
  { name: 'Heartland Farm Insurance', lines: ['Farm & ranch', 'Crop'], rep: 'Avery L.', phone: '(555) 010-2203', guides: 6, forms: 22 },
  { name: 'Red River Commercial', lines: ['Commercial'], rep: 'Morgan T.', phone: '(555) 010-2204', guides: 5, forms: 14 },
  { name: 'Lakes Life & Annuity', lines: ['Life & health'], rep: 'Riley K.', phone: '(555) 010-2205', guides: 2, forms: 9 },
  { name: 'Plains Crop Partners', lines: ['Crop'], rep: 'Quinn D.', phone: '(555) 010-2206', guides: 3, forms: 7 },
  { name: 'Bluestem Specialty', lines: ['Commercial', 'Farm & ranch'], rep: 'Drew S.', phone: '(555) 010-2207', guides: 2, forms: 6 },
  { name: 'Northwoods Health Plans', lines: ['Life & health'], rep: 'Sam P.', phone: '(555) 010-2208', guides: 1, forms: 5 },
];

/** Filter by line of business ('' = all) and free text across name, lines and rep. */
export function filterCarriers(list, { line = '', q = '' } = {}) {
  const needle = q.trim().toLowerCase();
  return list.filter(c => {
    if (line && !c.lines.includes(line)) return false;
    if (!needle) return true;
    return [c.name, c.rep, ...c.lines].some(v => v.toLowerCase().includes(needle));
  });
}

/** Count of carriers per line, for the filter chips. */
export function lineCounts(list) {
  return Object.fromEntries(LINES.map(l => [l, list.filter(c => c.lines.includes(l)).length]));
}
