# Run in SharePoint Online Management Shell after Connect-SPOService
$palette = @{
  "themePrimary" = "#2f6b3a";
  "themeLighterAlt" = "#f4f9f5";
  "themeLighter" = "#d3e7d6";
  "themeLight" = "#afd3b6";
  "themeTertiary" = "#6ea679";
  "themeSecondary" = "#3f7d4b";
  "themeDarkAlt" = "#2a6034";
  "themeDark" = "#24512c";
  "themeDarker" = "#1a3c21";
  "neutralLighterAlt" = "#faf9f8";
  "neutralLighter" = "#f3f2f1";
  "neutralLight" = "#edebe9";
  "neutralQuaternaryAlt" = "#e1dfdd";
  "neutralQuaternary" = "#d2d0ce";
  "neutralTertiaryAlt" = "#c8c6c4";
  "neutralTertiary" = "#a19f9d";
  "neutralSecondary" = "#605e5c";
  "neutralPrimaryAlt" = "#3b3a39";
  "neutralPrimary" = "#323130";
  "neutralDark" = "#201f1e";
  "black" = "#000000";
  "white" = "#ffffff";
}
Add-SPOTheme -Identity "Farmers Union Agency" -Palette $palette -IsInverted $false -Overwrite
