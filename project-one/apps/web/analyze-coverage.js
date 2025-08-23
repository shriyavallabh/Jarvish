const fs = require('fs');
const path = require('path');

const lcovData = fs.readFileSync('coverage/lcov.info', 'utf-8');
const lines = lcovData.split('\n');

const files = [];
let currentFile = null;
let currentLines = 0;
let currentCovered = 0;

lines.forEach(line => {
  if (line.startsWith('SF:')) {
    if (currentFile) {
      files.push({
        name: currentFile,
        total: currentLines,
        covered: currentCovered,
        percentage: currentLines > 0 ? (currentCovered / currentLines) * 100 : 0
      });
    }
    currentFile = line.substring(3);
    currentLines = 0;
    currentCovered = 0;
  } else if (line.startsWith('DA:')) {
    const parts = line.split(',');
    const hits = parseInt(parts[1]);
    currentLines++;
    if (hits > 0) {
      currentCovered++;
    }
  }
});

// Add last file
if (currentFile) {
  files.push({
    name: currentFile,
    total: currentLines,
    covered: currentCovered,
    percentage: currentLines > 0 ? (currentCovered / currentLines) * 100 : 0
  });
}

// Sort by total lines (descending) to find biggest impact files
const sortedBySize = [...files].sort((a, b) => b.total - a.total);

// Sort by coverage percentage to find least covered
const sortedByCoverage = [...files].sort((a, b) => a.percentage - b.percentage);

console.log('\n📊 FILES WITH MOST IMPACT (Largest with low coverage):');
console.log('=========================================================');
sortedBySize
  .filter(f => f.percentage < 50 && f.total > 50)
  .slice(0, 10)
  .forEach(f => {
    console.log(`${f.percentage.toFixed(1).padStart(5)}% | ${f.covered.toString().padStart(4)}/${f.total.toString().padEnd(4)} | ${f.name}`);
  });

console.log('\n🔴 COMPLETELY UNTESTED FILES (0% coverage):');
console.log('=========================================================');
sortedByCoverage
  .filter(f => f.percentage === 0 && f.total > 20)
  .slice(0, 10)
  .forEach(f => {
    console.log(`${f.total.toString().padStart(4)} lines | ${f.name}`);
  });

console.log('\n📈 PRIORITY TARGETS (Quick wins):');
console.log('=========================================================');
const quickWins = sortedBySize
  .filter(f => f.percentage > 0 && f.percentage < 30 && f.total > 30)
  .slice(0, 10);
  
quickWins.forEach(f => {
  const potentialGain = ((f.total - f.covered) / 11843 * 100).toFixed(2);
  console.log(`${f.percentage.toFixed(1).padStart(5)}% | +${potentialGain}% potential | ${f.name}`);
});

// Calculate potential coverage gain
const top10UncoveredLines = sortedBySize
  .slice(0, 10)
  .reduce((sum, f) => sum + (f.total - f.covered), 0);

const potentialCoverage = ((939 + top10UncoveredLines) / 11843 * 100).toFixed(2);
console.log('\n💡 INSIGHT:');
console.log(`Testing the top 10 largest files would increase coverage to ${potentialCoverage}%`);