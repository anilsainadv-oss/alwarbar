// Route segment config must be declared directly in this file (Next.js does not read re-exported config).
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // seconds (Hobby max with fluid compute; raise on Pro if needed)
export const preferredRegion = 'bom1'; // Mumbai - Indian gov sites often block/slow foreign IPs

export { GET, POST } from '../court-ingestion/route';
