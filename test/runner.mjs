import { runAuthTests } from './auth.test.mjs';
import { runSecurityIsolationTests } from './security-isolation.test.mjs';
import { runP0SecurityTests } from './security-p0.test.mjs';
import { runDatabaseStorageTests } from './database-storage.test.mjs';
import { runCaseClientManagementTests } from './case-client-management.test.mjs';
import { runAIDocumentManagementTests } from './ai-document-management.test.mjs';
import { runAutomationNotificationTests } from './automation-notifications.test.mjs';
import { runSaaSTeamManagementTests } from './saas-team-management.test.mjs';
import { runDatabasePgVectorTests } from './database-pgvector.test.mjs';
import { runIndexingPipelineTests } from './indexing-pipeline.test.mjs';
import { runHybridSearchTests } from './hybrid-search.test.mjs';
import { runRAGAssistantTests } from './rag-assistant.test.mjs';
import { runCaseResearchIntegrationTests } from './case-research-integration.test.mjs';
import { runAdminLegalLibraryTests } from './admin-legal-library.test.mjs';
import { runStorageDatabaseMonitorTests } from './storage-database-monitor.test.mjs';
import { runProductionReadinessTests } from './production-readiness.test.mjs';
import { runScDiscoveryPipelineTests } from './sc-discovery-pipeline.test.mjs';

async function main() {
  console.log('===============================================================');
  console.log('ALWAR ADVOCATES PORTAL — AUTOMATED TEST SUITE');
  console.log('===============================================================\n');

  try {
    await runAuthTests();
    console.log('');
    await runSecurityIsolationTests();
    console.log('');
    await runP0SecurityTests();
    console.log('');
    await runDatabaseStorageTests();
    console.log('');
    await runCaseClientManagementTests();
    console.log('');
    await runAIDocumentManagementTests();
    console.log('');
    await runAutomationNotificationTests();
    console.log('');
    await runSaaSTeamManagementTests();
    console.log('');
    await runDatabasePgVectorTests();
    console.log('');
    await runIndexingPipelineTests();
    console.log('');
    await runHybridSearchTests();
    console.log('');
    await runRAGAssistantTests();
    console.log('');
    await runCaseResearchIntegrationTests();
    console.log('');
    await runAdminLegalLibraryTests();
    console.log('');
    await runStorageDatabaseMonitorTests();
    console.log('');
    await runProductionReadinessTests();
    console.log('');
    await runScDiscoveryPipelineTests();

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
