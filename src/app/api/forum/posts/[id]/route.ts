import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/guards';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = localDb.getForumPostById(id);
  if (!post) {
    return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
  }

  const replies = localDb.getForumReplies(id);
  return NextResponse.json({ post, replies });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to post a reply.' }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Reply text cannot be blank.' }, { status: 400 });
    }

    const advocateProfile = localDb.getAdvocateProfileByUserId(user.id);

    const reply = localDb.createForumReply({
      post_id: id,
      user_id: user.id,
      author_name: user.full_name,
      author_enrollment: advocateProfile?.bar_council_enrollment_no,
      author_verified: advocateProfile?.is_verified ?? false,
      content: content.trim()
    });

    return NextResponse.json({ success: true, reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reply failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
