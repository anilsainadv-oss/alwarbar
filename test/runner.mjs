import { runAuthTests } from './auth.test.mjs';
import { runSecurityIsolationTests } from './security-isolation.test.mjs';

async function main() {
  console.log('===============================================================');
  console.log('ALWAR ADVOCATES PORTAL — AUTOMATED TEST SUITE');
  console.log('===============================================================\n');

  try {
    await runAuthTests();
    console.log('');
    await runSecurityIsolationTests();

    console.log('\n===============================================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY (0 ERRORS)');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\nTEST SUITE FAILED:', err);
    process.exit(1);
  }
}

main();
