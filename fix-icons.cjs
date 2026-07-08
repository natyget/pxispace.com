const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find src -type f -name "*.jsx" -o -name "*.tsx"').toString().split('\n').filter(Boolean);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  const tagRegex = /<(HugeiconsIcon|svg)([^>]*?)>/g;

  content = content.replace(tagRegex, (match, tag, attrs) => {
    const classRegex = /className=(['"])(.*?)\1/g;
    const newAttrs = attrs.replace(classRegex, (classMatch, quote, classNames) => {
      let newClassNames = classNames;
      newClassNames = newClassNames.replace(/(^|\s)text-([a-zA-Z0-9-]+)\/([0-9]+)/g, '$1text-$2 opacity-$3');
      newClassNames = newClassNames.replace(/(^|\s)hover:text-([a-zA-Z0-9-]+)\/([0-9]+)/g, '$1hover:opacity-$3');
      newClassNames = newClassNames.replace(/(^|\s)group-hover:text-([a-zA-Z0-9-]+)\/([0-9]+)/g, '$1group-hover:opacity-$3');
      return `className=${quote}${newClassNames}${quote}`;
    });
    if (attrs !== newAttrs) {
      modified = true;
    }
    return `<${tag}${newAttrs}>`;
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
