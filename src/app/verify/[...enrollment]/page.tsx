import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ enrollment: string[] | string }>;
}

export default async function VerifyCatchAllPage({ params }: Props) {
  const resolved = await params;
  let rawEnrollment = 'R/2268/2009';
  if (Array.isArray(resolved.enrollment)) {
    rawEnrollment = resolved.enrollment.join('/');
  } else if (resolved.enrollment) {
    rawEnrollment = resolved.enrollment;
  }
  const normalized = decodeURIComponent(rawEnrollment).replace(/[-_]/g, '/');
  redirect(`/verify?enrollment=${encodeURIComponent(normalized)}`);
}
