const fs = require('fs');
const glob = require('glob');

// Fix _width in screens
const files = glob.sync('src/screens/**/*.tsx');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('const { _width }')) {
    content = content.replace(/const \{ _width \} = Dimensions\.get\('window'\);/g, "const { width: _width } = Dimensions.get('window');");
    fs.writeFileSync(file, content);
  }
}

// Fix ColorSchemeName 'unspecified' overlap
const tabsFile = 'src/components/app-tabs.tsx';
if (fs.existsSync(tabsFile)) {
  let content = fs.readFileSync(tabsFile, 'utf8');
  content = content.replace(/scheme === 'unspecified'/g, "(scheme as any) === 'unspecified'");
  content = content.replace(/colors = Colors\[(.*?)\s*\?.*?\]/g, "colors = Colors[scheme ?? 'light']");
  fs.writeFileSync(tabsFile, content);
}

const tabsWebFile = 'src/components/app-tabs.web.tsx';
if (fs.existsSync(tabsWebFile)) {
  let content = fs.readFileSync(tabsWebFile, 'utf8');
  content = content.replace(/scheme === 'unspecified'/g, "(scheme as any) === 'unspecified'");
  content = content.replace(/colors = Colors\[(.*?)\s*\?.*?\]/g, "colors = Colors[scheme ?? 'light']");
  fs.writeFileSync(tabsWebFile, content);
}

const useThemeFile = 'src/hooks/use-theme.ts';
if (fs.existsSync(useThemeFile)) {
  let content = fs.readFileSync(useThemeFile, 'utf8');
  content = content.replace(/scheme === 'unspecified'/g, "(scheme as any) === 'unspecified'");
  content = content.replace(/const theme = .*?;/g, "const theme = scheme ?? 'light';");
  fs.writeFileSync(useThemeFile, content);
}

