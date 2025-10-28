// Simple script to identify mismatched JSX tags
const fs = require('fs');

const filePath = './src/components/TileEditor.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Split by lines for better error reporting
const lines = content.split('\n');

console.log(`Checking JSX structure in ${filePath}...`);

// Very basic tag matching check
const stack = [];
const tagRegex = /<(\/?)([\w\.]+)([^>]*)>/g;

let match;
let lineNumber = 1;
let inComment = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  lineNumber = i + 1;
  
  // Skip comments
  if (line.trim().startsWith('//') || line.trim().startsWith('/*') || inComment) {
    if (line.includes('/*') && !line.includes('*/')) inComment = true;
    if (line.includes('*/')) inComment = false;
    continue;
  }
  
  // Reset the regex for each line
  tagRegex.lastIndex = 0;
  
  while ((match = tagRegex.exec(line)) !== null) {
    const [fullTag, slash, tagName, attributes] = match;
    
    // Skip self-closing tags
    if (attributes.endsWith('/') || tagName === 'br' || tagName === 'img' || tagName === 'input') {
      continue;
    }
    
    if (slash) {  // Closing tag
      if (stack.length === 0) {
        console.error(`Line ${lineNumber}: Unexpected closing tag </${tagName}> without matching opening tag`);
        continue;
      }
      const lastTag = stack.pop();
      if (lastTag !== tagName) {
        console.error(`Line ${lineNumber}: Mismatched tag </
${tagName}> - expected </${lastTag}>`);
      }
    } else {  // Opening tag
      stack.push(tagName);
    }
  }
}

if (stack.length > 0) {
  console.error(`Unclosed tags remaining: ${stack.join(', ')}`);
}

console.log('JSX structure check completed.');
