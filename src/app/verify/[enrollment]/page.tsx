import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ enrollment: string }>;
}

export default async function VerifyDynamicPage({ params }: Props) {
  const resolved = await params;
  const rawEnrollment = resolved.enrollment || 'R/2268/2009';
  const normalized = decodeURIComponent(rawEnrollment).replace(/[-_]/g, '/');
  redirect(`/verify?enrollment=${encodeURIComponent(normalized)}`);
}
