const fs = require('fs');

const lcovData = fs.readFileSync('coverage/lcov.info', 'utf-8');
const lines = lcovData.split('\n');

let totalLines = 0;
let coveredLines = 0;

lines.forEach(line => {
  if (line.startsWith('DA:')) {
    const parts = line.split(',');
    const hits = parseInt(parts[1]);
    totalLines++;
    if (hits > 0) {
      coveredLines++;
    }
  }
});

const percentage = totalLines > 0 ? ((coveredLines / totalLines) * 100).toFixed(2) : 0;

console.log('=================================');
console.log('📊 Test Coverage Summary');
console.log('=================================');
console.log(`Total Lines: ${totalLines}`);
console.log(`Covered Lines: ${coveredLines}`);
console.log(`Uncovered Lines: ${totalLines - coveredLines}`);
console.log(`Coverage: ${percentage}%`);
console.log('=================================');

if (percentage < 85) {
  console.log(`⚠️  Coverage is below 85% target (current: ${percentage}%)`);
} else {
  console.log('✅ Coverage meets or exceeds 85% target!');
}