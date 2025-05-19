const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLD = 95; // 95% coverage required

function checkCoverage(coveragePath) {
  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const total = coverage.total;
    
    const statements = (total.statements.pct >= COVERAGE_THRESHOLD);
    const branches = (total.branches.pct >= COVERAGE_THRESHOLD);
    const functions = (total.functions.pct >= COVERAGE_THRESHOLD);
    const lines = (total.lines.pct >= COVERAGE_THRESHOLD);

    console.log('\nCoverage Report:');
    console.log('----------------');
    console.log(`Statements: ${total.statements.pct}% (${statements ? '✅' : '❌'})`);
    console.log(`Branches: ${total.branches.pct}% (${branches ? '✅' : '❌'})`);
    console.log(`Functions: ${total.functions.pct}% (${functions ? '✅' : '❌'})`);
    console.log(`Lines: ${total.lines.pct}% (${lines ? '✅' : '❌'})`);

    if (!statements || !branches || !functions || !lines) {
      console.error('\n❌ Coverage threshold not met!');
      process.exit(1);
    }

    console.log('\n✅ All coverage thresholds met!');
  } catch (error) {
    console.error('Error reading coverage file:', error);
    process.exit(1);
  }
}

// Check both frontend and backend coverage
const backendCoverage = path.join(__dirname, '../backend/coverage/coverage-summary.json');
const frontendCoverage = path.join(__dirname, '../frontend/coverage/coverage-summary.json');

console.log('Checking backend coverage...');
checkCoverage(backendCoverage);

console.log('\nChecking frontend coverage...');
checkCoverage(frontendCoverage); 