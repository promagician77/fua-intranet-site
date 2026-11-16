// PnP provisioning template (schema 2022/09) generated from the IA.
// Apply with PnP PowerShell:  Invoke-PnPTenantTemplate -Path fua-intranet.xml -Parameters @{...}
import { AUDIENCES, SITES, NAV, FIELDS, LISTS, HOME_PAGE } from './ia.mjs';

const NS = 'http://schemas.dev.office.com/PnP/2022/09/ProvisioningSchema';
export const THEME_NAME = 'Farmers Union Agency';

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null)
  .map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
const group = (id) => `{parameter:${AUDIENCES.find(a => a.id === id).param}}`;

function fieldXml(name) {
  const f = FIELDS[name];
  const base = { ID: `{${f.id}}`, Name: name, StaticName: name, DisplayName: f.display, Type: f.type,
    Group: 'FUA Intranet', Indexed: f.indexed ? 'TRUE' : undefined };
  if (f.type === 'URL') base.Format = 'Hyperlink';
  if (f.type === 'DateTime') base.Format = 'DateOnly';
  if (f.choices) {
    const ch = f.choices.map(c => `<CHOICE>${esc(c)}</CHOICE>`).join('');
    return `<Field ${attrs(base)}><CHOICES>${ch}</CHOICES></Field>`;
  }
  return `<Field ${attrs(base)} />`;
}

function navXml(nodes, depth = 3) {
  const pad = ' '.repeat(depth * 2);
  return nodes.map(n => {
    const a = attrs({ Title: n.title, Url: n.url, IsExternal: 'false' });
    if (!n.children) return `${pad}<pnp:NavigationNode ${a} />`;
    return `${pad}<pnp:NavigationNode ${a}>\n${navXml(n.children, depth + 1)}\n${pad}</pnp:NavigationNode>`;
  }).join('\n');
}

function listXml(l) {
  const a = attrs({ Title: l.title, Url: l.url, TemplateType: l.template, OnQuickLaunch: 'false',
    EnableVersioning: l.template === 101 ? 'true' : undefined,
    MaxVersionLimit: l.template === 101 ? 100 : undefined,
    EnableAudienceTargeting: l.audienceTargeting ? 'true' : undefined });
  const refs = l.fields.map(f => `          <pnp:FieldRef ID="{${FIELDS[f].id}}" Name="${f}" DisplayName="${esc(FIELDS[f].display)}" />`).join('\n');
  return refs
    ? `        <pnp:ListInstance ${a}>\n          <pnp:FieldRefs>\n${refs.replace(/^ {10}/gm, '            ')}\n          </pnp:FieldRefs>\n        </pnp:ListInstance>`
    : `        <pnp:ListInstance ${a} />`;
}

function homePageXml() {
  const sections = HOME_PAGE.map((s, i) => {
    const controls = s.controls.map((c, j) =>
      `              <pnp:CanvasControl WebPartType="${c.part}" Order="${j + 1}" Column="${j + 1}" JsonControlData="{}" />`).join('\n');
    return `          <pnp:Section Order="${i + 1}" Type="${s.section}">\n            <pnp:Controls>\n${controls}\n            </pnp:Controls>\n          </pnp:Section>`;
  }).join('\n');
  return `      <pnp:ClientSidePages>
        <pnp:ClientSidePage PageName="Home.aspx" Title="Home" Layout="Home" Overwrite="true" Publish="true" EnableComments="false">
          <pnp:Sections>
${sections}
          </pnp:Sections>
        </pnp:ClientSidePage>
      </pnp:ClientSidePages>`;
}

function securityXml(site) {
  const visitors = site.access === 'EEEU' ? ['{parameter:EveryoneExceptExternal}'] : site.access.map(group);
  const members = site.editors.map(group);
  const users = (arr) => arr.map(u => `          <pnp:User Name="${esc(u)}" />`).join('\n');
  return `      <pnp:Security>
        <pnp:AdditionalOwners>
          <pnp:User Name="{parameter:IntranetOwner}" />
        </pnp:AdditionalOwners>
        <pnp:AdditionalMembers>
${users(members)}
        </pnp:AdditionalMembers>
        <pnp:AdditionalVisitors>
${users(visitors)}
        </pnp:AdditionalVisitors>
      </pnp:Security>`;
}

function templateXml(site, palette) {
  const hub = SITES.find(s => s.hub);
  const lists = LISTS[site.key] || [];
  const usedFields = [...new Set(lists.flatMap(l => l.fields))];
  const web = attrs({ Title: site.title, CommentsOnSitePagesDisabled: 'true', MembersCanShare: 'false',
    HubSiteUrl: site.hub ? undefined : `{hosturl}/${hub.url}`, SearchScope: 'Hub' });
  const parts = [];
  parts.push(`      <pnp:WebSettings ${web} />`);
  if (palette) parts.push(`      <pnp:Theme Name="${esc(THEME_NAME)}" IsInverted="false" />`);
  parts.push(securityXml(site));
  if (site.hub) {
    parts.push(`      <pnp:Navigation AddNewPagesToNavigation="false" CreateFriendlyUrlsForNewPages="true" EnableAudienceTargeting="true">
        <pnp:GlobalNavigation NavigationType="Structural">
          <pnp:StructuralNavigation RemoveExistingNodes="true">
${navXml(NAV, 6)}
          </pnp:StructuralNavigation>
        </pnp:GlobalNavigation>
      </pnp:Navigation>`);
  }
  if (usedFields.length) {
    parts.push(`      <pnp:SiteFields>\n${usedFields.map(f => '        ' + fieldXml(f)).join('\n')}\n      </pnp:SiteFields>`);
  }
  if (lists.length) parts.push(`      <pnp:Lists>\n${lists.map(listXml).join('\n')}\n      </pnp:Lists>`);
  if (site.hub) parts.push(homePageXml());
  if (site.hub) parts.push(`      <pnp:Header Layout="Standard" MenuStyle="MegaMenu" BackgroundEmphasis="Strong" ShowSiteTitle="true" ShowSiteNavigation="true" />`);
  return `    <pnp:ProvisioningTemplate ID="FUA-${site.key.toUpperCase()}" Version="1" Scope="RootSite">\n${parts.join('\n')}\n    </pnp:ProvisioningTemplate>`;
}

function siteCollectionXml(site) {
  const common = { ProvisioningId: `FUA.${site.key}`, Title: site.title, Description: `${site.title}, part of the Farmers Union Agency intranet`,
    IsHubSite: site.hub ? 'true' : 'false', Language: '1033' };
  const xsi = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
  const head = site.type === 'CommunicationSite'
    ? `<pnp:SiteCollection ${xsi} xsi:type="pnp:CommunicationSite" ${attrs({ ...common, Url: `{hosturl}/${site.url}`, Owner: '{parameter:IntranetOwner}', AllowFileSharingForGuestUsers: 'false' })}>`
    : `<pnp:SiteCollection ${xsi} xsi:type="pnp:TeamSite" ${attrs({ ...common, Alias: site.alias, DisplayName: site.title, IsPublic: 'false', Teamify: 'true' })}>`;
  return `      ${head}
        <pnp:Templates>
          <pnp:ProvisioningTemplateReference ID="FUA-${site.key.toUpperCase()}" />
        </pnp:Templates>
      </pnp:SiteCollection>`;
}

/** The complete provisioning document. */
export function buildTemplate({ palette = null, sites = SITES } = {}) {
  const params = [
    ['IntranetOwner', 'intranet.owner@yourdomain.com'],
    ...AUDIENCES.map(a => [a.param, a.name]),
  ].map(([k, v]) => `      <pnp:Parameter Key="${k}">${esc(v)}</pnp:Parameter>`).join('\n');
  const tenant = palette
    ? `  <pnp:Tenant>
    <pnp:Themes>
      <pnp:Theme Name="${esc(THEME_NAME)}" IsInverted="false" Overwrite="true">
${esc(JSON.stringify(palette, null, 2))}
      </pnp:Theme>
    </pnp:Themes>
  </pnp:Tenant>\n` : '';
  return `<?xml version="1.0" encoding="utf-8"?>
<pnp:Provisioning xmlns:pnp="${NS}" Author="Santiago" Generator="fua-intranet engine" Version="1.0"
                  DisplayName="Farmers Union Agency intranet (concept)" Description="Hub, carrier center, resources, department and leadership sites">
  <pnp:Preferences Generator="fua-intranet engine">
    <pnp:Parameters>
${params}
    </pnp:Parameters>
  </pnp:Preferences>
${tenant}  <pnp:Templates ID="FUA-TEMPLATES">
${sites.map(s => templateXml(s, palette)).join('\n')}
  </pnp:Templates>
  <pnp:Sequence ID="FUA-SEQUENCE">
    <pnp:SiteCollections>
${sites.map(siteCollectionXml).join('\n')}
    </pnp:SiteCollections>
  </pnp:Sequence>
</pnp:Provisioning>
`;
}

/** Quick stats for the site and README. */
export function templateStats(xml) {
  const count = (re) => (xml.match(re) || []).length;
  return {
    siteCollections: count(/<pnp:SiteCollection /g),
    templates: count(/<pnp:ProvisioningTemplate /g),
    lists: count(/<pnp:ListInstance /g),
    fields: new Set([...xml.matchAll(/<Field ID="\{([^}]+)\}"/g)].map(m => m[1])).size,
    navNodes: count(/<pnp:NavigationNode /g),
    webParts: count(/<pnp:CanvasControl /g),
    bytes: xml.length,
  };
}
