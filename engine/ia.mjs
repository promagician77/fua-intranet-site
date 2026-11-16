// Information architecture for the Farmers Union Agency intranet concept.
// One source of truth: the concept page, the PnP provisioning template and the
// permissions matrix are all generated from this file.

/** Audiences are Microsoft Entra groups. Modern SharePoint audience targeting
 *  accepts Entra security / Microsoft 365 groups, not SharePoint groups. */
export const AUDIENCES = [
  { id: 'staff',      name: 'FUA State Office Staff', kind: 'security', param: 'GroupStaff' },
  { id: 'agents',     name: 'FUA Agents',             kind: 'security', param: 'GroupAgents' },
  { id: 'leaders',    name: 'FUA Leadership',         kind: 'security', param: 'GroupLeaders' },
  { id: 'publishers', name: 'FUA Intranet Publishers', kind: 'security', param: 'GroupPublishers' },
];

/** Demo personas: which Entra groups each one belongs to. */
export const PERSONAS = {
  staff:  { label: 'State Office staff', groups: ['staff'] },
  agent:  { label: 'Agent',              groups: ['agents'] },
  leader: { label: 'Leadership',         groups: ['staff', 'leaders', 'publishers'] },
};

export const LINES = ['Personal auto', 'Home', 'Farm & ranch', 'Commercial', 'Crop', 'Life & health'];

/** Sites. access = who can open the site (Entra group ids, or 'EEEU'). */
export const SITES = [
  { key: 'home', type: 'CommunicationSite', url: 'sites/fua-intranet', title: 'FUA Intranet',
    hub: true, orgNews: true, access: ['staff', 'agents', 'leaders'], editors: ['publishers'] },
  { key: 'carriers', type: 'CommunicationSite', url: 'sites/fua-carriers', title: 'Carrier Resource Center',
    access: ['staff', 'agents', 'leaders'], editors: ['publishers'] },
  { key: 'resources', type: 'CommunicationSite', url: 'sites/fua-resources', title: 'Agent & Employee Resources',
    access: ['staff', 'agents', 'leaders'], editors: ['publishers'] },
  { key: 'operations', type: 'TeamSite', alias: 'fua-agency-operations', title: 'Agency Operations',
    access: ['staff', 'leaders'], editors: ['staff'] },
  { key: 'leadership', type: 'TeamSite', alias: 'fua-leadership', title: 'Leadership',
    access: ['leaders'], editors: ['leaders'] },
];

/** Hub (mega menu) navigation. audiences: [] = everyone who can open the hub. */
export const NAV = [
  { title: 'Home', url: '{hosturl}/sites/fua-intranet', audiences: [] },
  { title: 'Carriers', audiences: [], children: [
    { title: 'All carriers', url: '{hosturl}/sites/fua-carriers', audiences: [] },
    { title: 'Underwriting guidelines', url: '{hosturl}/sites/fua-carriers/Underwriting', audiences: [] },
    { title: 'Applications & forms', url: '{hosturl}/sites/fua-carriers/Applications', audiences: [] },
    { title: 'Carrier contacts', url: '{hosturl}/sites/fua-carriers/Lists/Carriers', audiences: [] },
  ] },
  { title: 'Resources', audiences: [], children: [
    { title: 'Forms & templates', url: '{hosturl}/sites/fua-resources/Forms', audiences: [] },
    { title: 'Marketing kit', url: '{hosturl}/sites/fua-resources/Marketing', audiences: [] },
    { title: 'Training & webinars', url: '{hosturl}/sites/fua-resources/Training', audiences: [] },
    { title: 'Procedures', url: '{hosturl}/sites/fua-resources/Procedures', audiences: [] },
  ] },
  { title: 'News', audiences: [], children: [
    { title: 'All news', url: '{hosturl}/sites/fua-intranet/SitePages/News.aspx', audiences: [] },
    { title: 'Agent spotlights', url: '{hosturl}/sites/fua-intranet/SitePages/Spotlights.aspx', audiences: [] },
    { title: 'Publish a news post', url: '{hosturl}/sites/fua-intranet/SitePages/Publish.aspx', audiences: ['publishers'] },
  ] },
  { title: 'People', audiences: [], children: [
    { title: 'Staff & agent directory', url: '{hosturl}/sites/fua-intranet/SitePages/Directory.aspx', audiences: [] },
    { title: 'Office locations', url: '{hosturl}/sites/fua-intranet/Lists/Offices', audiences: [] },
    { title: 'Key contacts', url: '{hosturl}/sites/fua-intranet/SitePages/Contacts.aspx', audiences: [] },
  ] },
  { title: 'Departments', audiences: ['staff', 'leaders'], children: [
    { title: 'Agency Operations', url: '{hosturl}/sites/fua-agency-operations', audiences: ['staff', 'leaders'] },
    { title: 'Leadership', url: '{hosturl}/sites/fua-leadership', audiences: ['leaders'] },
  ] },
  { title: 'Calendar', url: '{hosturl}/sites/fua-intranet/SitePages/Calendar.aspx', audiences: [] },
];

/** Site columns, keyed by internal name. IDs are fixed so re-provisioning updates in place. */
export const FIELDS = {
  FuaLines:        { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000001', type: 'MultiChoice', display: 'Lines of business', choices: LINES },
  FuaPortalUrl:    { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000002', type: 'URL',        display: 'Agent portal' },
  FuaGuideUrl:     { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000003', type: 'URL',        display: 'Underwriting guide' },
  FuaRepName:      { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000004', type: 'Text',       display: 'Rep name' },
  FuaRepEmail:     { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000005', type: 'Text',       display: 'Rep email' },
  FuaRepPhone:     { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000006', type: 'Text',       display: 'Rep phone' },
  FuaCarrier:      { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000007', type: 'Text',       display: 'Carrier', indexed: true },
  FuaDocType:      { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000008', type: 'Choice',     display: 'Document type', indexed: true,
                     choices: ['Application', 'Underwriting guideline', 'Rate sheet', 'Form', 'Brochure'] },
  FuaLine:         { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000009', type: 'Choice',     display: 'Line of business', indexed: true, choices: LINES },
  FuaEffective:    { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a00000a', type: 'DateTime',   display: 'Effective date' },
  FuaAssetType:    { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a00000b', type: 'Choice',     display: 'Asset type', indexed: true,
                     choices: ['Logo', 'Social post', 'Print ad', 'Email template', 'Brochure'] },
  FuaExpires:      { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a00000c', type: 'DateTime',   display: 'Use until' },
  FuaTopic:        { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a00000d', type: 'Choice',     display: 'Topic', indexed: true,
                     choices: ['Products', 'Systems', 'Sales', 'Compliance', 'Onboarding'] },
  FuaDepartment:   { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a00000e', type: 'Choice',     display: 'Department', indexed: true,
                     choices: ['Agency Operations', 'Accounting', 'Marketing', 'Licensing', 'Leadership'] },
  FuaReviewDate:   { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a00000f', type: 'DateTime',   display: 'Next review' },
  FuaOfficeCity:   { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000010', type: 'Text',       display: 'City', indexed: true },
  FuaOfficePhone:  { id: '6f1c2a10-1d0e-4b7a-9a51-0c4f1a000011', type: 'Text',       display: 'Office phone' },
};

/** Lists and libraries per site. template: 100 list, 101 library, 106 events. */
export const LISTS = {
  home: [
    { title: 'Events', url: 'Lists/Events', template: 106, audienceTargeting: true, fields: [] },
    { title: 'Offices', url: 'Lists/Offices', template: 100, fields: ['FuaOfficeCity', 'FuaOfficePhone'] },
  ],
  carriers: [
    { title: 'Carriers', url: 'Lists/Carriers', template: 100,
      fields: ['FuaLines', 'FuaPortalUrl', 'FuaGuideUrl', 'FuaRepName', 'FuaRepEmail', 'FuaRepPhone'] },
    { title: 'Underwriting', url: 'Underwriting', template: 101, audienceTargeting: true,
      fields: ['FuaCarrier', 'FuaLine', 'FuaDocType', 'FuaEffective'] },
    { title: 'Applications', url: 'Applications', template: 101,
      fields: ['FuaCarrier', 'FuaLine', 'FuaDocType', 'FuaEffective'] },
  ],
  resources: [
    { title: 'Forms', url: 'Forms', template: 101, fields: ['FuaDocType', 'FuaDepartment'] },
    { title: 'Marketing', url: 'Marketing', template: 101, audienceTargeting: true, fields: ['FuaAssetType', 'FuaLine', 'FuaExpires'] },
    { title: 'Training', url: 'Training', template: 101, fields: ['FuaTopic', 'FuaLine'] },
    { title: 'Procedures', url: 'Procedures', template: 101, fields: ['FuaDepartment', 'FuaReviewDate'] },
  ],
  operations: [],
  leadership: [],
};

/** Home page layout: every block is an out-of-the-box SharePoint web part. */
export const HOME_PAGE = [
  { section: 'OneColumn', controls: [{ part: 'Hero', note: 'Five tiles, each linked to a hub page' }] },
  { section: 'TwoColumnLeft', controls: [
    { part: 'News', note: 'Source: this site (organization news site), audience targeting on' },
    { part: 'QuickLinks', note: 'Compact layout, audience targeting on' },
  ] },
  { section: 'TwoColumnLeft', controls: [
    { part: 'ContentRollup', note: 'Highlighted content: forms changed in the last 30 days' },
    { part: 'Events', note: 'Events list, next 4, audience targeting on' },
  ] },
  { section: 'OneColumn', controls: [{ part: 'People', note: 'Key contacts, read from Microsoft 365 profiles' }] },
];

/** Quick links shown on the home page. */
export const QUICK_LINKS = [
  { id: 'ql-carriers', title: 'Carrier portals', audiences: [] },
  { id: 'ql-forms', title: 'Applications & forms', audiences: [] },
  { id: 'ql-marketing', title: 'Marketing kit', audiences: [] },
  { id: 'ql-training', title: 'Training & webinars', audiences: [] },
  { id: 'ql-ams', title: 'Agency management system', audiences: [], placeholder: true },
  { id: 'ql-directory', title: 'Directory', audiences: [] },
  { id: 'ql-publish', title: 'Publish a news post', audiences: ['publishers'] },
  { id: 'ql-leadership', title: 'Leadership workspace', audiences: ['leaders'] },
];

/** Sample news (concept content). */
export const NEWS = [
  { id: 'n1', title: 'Office closed Nov 26–27 for Thanksgiving', tag: 'Announcement', audiences: [] },
  { id: 'n2', title: 'New farm & ranch applications are in the Carrier Resource Center', tag: 'Carriers', audiences: ['agents', 'staff'] },
  { id: 'n3', title: 'Agent spotlight: a 25-year milestone in the Detroit Lakes office', tag: 'Spotlight', audiences: [] },
  { id: 'n4', title: 'Year-end licensing renewals: what to send the State Office', tag: 'Compliance', audiences: ['agents'] },
  { id: 'n5', title: '2027 planning retreat: agenda and pre-reads', tag: 'Leadership', audiences: ['leaders'] },
  { id: 'n6', title: 'Month-end close schedule for December', tag: 'Operations', audiences: ['staff'] },
];

/** Sample events. */
export const EVENTS = [
  { id: 'e1', title: 'Webinar: farm program changes for 2027', date: '2026-12-03', audiences: [] },
  { id: 'e2', title: 'State Office holiday lunch', date: '2026-12-11', audiences: ['staff', 'leaders'] },
  { id: 'e3', title: 'Leadership meeting', date: '2026-12-15', audiences: ['leaders'] },
  { id: 'e4', title: 'Annual agents meeting (save the date)', date: '2027-01-21', audiences: [] },
];

/** Every audience id referenced anywhere in the IA. */
export function audienceRefs() {
  const refs = [];
  const walk = (nodes) => nodes.forEach(n => { refs.push(...n.audiences); if (n.children) walk(n.children); });
  walk(NAV);
  [QUICK_LINKS, NEWS, EVENTS].forEach(arr => arr.forEach(i => refs.push(...i.audiences)));
  SITES.forEach(s => { if (Array.isArray(s.access)) refs.push(...s.access); refs.push(...s.editors); });
  return refs;
}
