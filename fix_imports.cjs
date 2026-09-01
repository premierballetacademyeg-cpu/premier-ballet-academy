const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('D:/Downloads/Anja Shets/premier-ballet-loyalty/New App/server/**/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (p1.endsWith('.js')) return match;
    return `from '${p1}.js'`;
  });
  content = content.replace(/import\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (p1.endsWith('.js')) return match;
    return `import '${p1}.js'`;
  });
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed imports in', files.length, 'files');
