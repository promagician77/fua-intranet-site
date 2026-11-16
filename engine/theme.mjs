// SharePoint theme from one brand color, plus WCAG contrast checks.
// The palette comes from Fluent UI's ThemeGenerator (@fluentui/react), passed in as `fluent`
// so this module has no import side effects and runs the same in Node and the browser.

/** The palette keys SharePoint site themes use (Add-SPOTheme / brand center). */
export const SP_KEYS = ['themePrimary', 'themeLighterAlt', 'themeLighter', 'themeLight', 'themeTertiary',
  'themeSecondary', 'themeDarkAlt', 'themeDark', 'themeDarker', 'neutralLighterAlt', 'neutralLighter',
  'neutralLight', 'neutralQuaternaryAlt', 'neutralQuaternary', 'neutralTertiaryAlt', 'neutralTertiary',
  'neutralSecondary', 'neutralPrimaryAlt', 'neutralPrimary', 'neutralDark', 'black', 'white'];

export function isHex(s) { return /^#[0-9a-fA-F]{6}$/.test(s); }

/**
 * Generate the SharePoint palette for a primary color on a white page.
 * theme* slots come from ThemeGenerator. Neutral slots default to Fluent's DefaultPalette,
 * because the generated neutral ramp puts secondary text at about 2.5:1 on white.
 * Pass { neutrals: 'generated' } to get the raw generator output for comparison.
 */
export function paletteFor(primary, fluent, { text = '#323130', background = '#ffffff', neutrals = 'fluent-default' } = {}) {
  if (!isHex(primary)) throw new Error(`not a #rrggbb color: ${primary}`);
  const { ThemeGenerator, themeRulesStandardCreator, BaseSlots, getColorFromString, isDark, DefaultPalette } = fluent;
  const rules = themeRulesStandardCreator();
  ThemeGenerator.insureSlots(rules, isDark(rules[BaseSlots[BaseSlots.backgroundColor]].color));
  ThemeGenerator.setSlot(rules[BaseSlots[BaseSlots.primaryColor]], getColorFromString(primary), false, true, true);
  ThemeGenerator.setSlot(rules[BaseSlots[BaseSlots.foregroundColor]], getColorFromString(text), false, true, true);
  ThemeGenerator.setSlot(rules[BaseSlots[BaseSlots.backgroundColor]], getColorFromString(background), false, true, true);
  const json = ThemeGenerator.getThemeAsJson(rules);
  const out = {};
  for (const k of SP_KEYS) {
    const useDefault = neutrals === 'fluent-default' && !k.startsWith('theme');
    out[k] = (useDefault ? DefaultPalette[k] : json[k]).toLowerCase();
  }
  return out;
}

function channel(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
/** WCAG 2.x contrast ratio, rounded down to 2 decimals so a "4.5" is never rounded up. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.floor(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** The pairs a SharePoint page actually renders with the theme. */
export const PAIRS = [
  { id: 'button', fg: 'white', bg: 'themePrimary', need: 4.5, use: 'White text on primary buttons and the site header' },
  { id: 'button-hover', fg: 'white', bg: 'themeDarkAlt', need: 4.5, use: 'Button hover' },
  { id: 'link', fg: 'themePrimary', bg: 'white', need: 4.5, use: 'Links and web part titles' },
  { id: 'link-tint', fg: 'themeDark', bg: 'themeLighter', need: 4.5, use: 'Text on a tinted (soft) section' },
  { id: 'body', fg: 'neutralPrimary', bg: 'white', need: 4.5, use: 'Body text' },
  { id: 'secondary', fg: 'neutralSecondary', bg: 'white', need: 4.5, use: 'Secondary text: dates, bylines' },
];

export function contrastChecks(palette) {
  return PAIRS.map(p => {
    const ratio = contrast(palette[p.fg], palette[p.bg]);
    return { ...p, fgHex: palette[p.fg], bgHex: palette[p.bg], ratio, pass: ratio >= p.need };
  });
}

/** PowerShell to register the theme tenant-wide (SharePoint Online Management Shell). */
export function powershell(name, palette) {
  const lines = SP_KEYS.map(k => `  "${k}" = "${palette[k]}";`);
  return [
    '# Run in SharePoint Online Management Shell after Connect-SPOService',
    '$palette = @{',
    ...lines,
    '}',
    `Add-SPOTheme -Identity "${name}" -Palette $palette -IsInverted $false -Overwrite`,
  ].join('\n');
}

/** JSON for the PnP template's <pnp:Theme> element. */
export function themeJson(palette) {
  return JSON.stringify(palette, null, 2);
}
