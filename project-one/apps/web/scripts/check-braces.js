#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tests/unit/services/email-verification.test.ts');
const content = fs.readFileSync(filePath, 'utf8');

let openBraces = 0;
let closeBraces = 0;
let openParens = 0;
let closeParens = 0;

for (const char of content) {
  if (char === '{') openBraces++;
  if (char === '}') closeBraces++;
  if (char === '(') openParens++;
  if (char === ')') closeParens++;
}

console.log(`Open braces: ${openBraces}`);
console.log(`Close braces: ${closeBraces}`);
console.log(`Difference: ${openBraces - closeBraces}`);
console.log(`Open parens: ${openParens}`);
console.log(`Close parens: ${closeParens}`);
console.log(`Difference: ${openParens - closeParens}`);