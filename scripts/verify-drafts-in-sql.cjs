const fs = require('fs');
const content = fs.readFileSync('C:/alwar-advocates/migrations/010_complete_precedent_engine_migration.sql', 'utf8');

const draftIds = [
  'doc-8a983296-0771-4b37-802c-74fac6082949',
  'doc-daf515fd-1407-41b6-bff2-80bb7a3a5ce6',
  'doc-8169c79e-407c-4f20-a1d1-b53de1210a62',
  'doc-1cca7d96-278d-48ad-b299-80a80e8cc824',
  'doc-47d80f6b-1d3c-4c55-a298-e4c3999efe5e',
  'doc-b30e825d-b8f7-4491-a727-5a346b44ee46'
];

draftIds.forEach(id => {
  const pos = content.indexOf(id);
  const nextPos = content.indexOf('ON CONFLICT (id)', pos);
  const snippet = content.substring(pos, nextPos);
  const isDraft = snippet.includes("'draft'");
  console.log(id, '-> publication_status is draft:', isDraft);
});
