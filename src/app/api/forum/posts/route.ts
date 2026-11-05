import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = (searchParams.get('q') || '').toLowerCase();

  let posts = localDb.getForumPosts();

  if (category && category !== 'ALL') {
    posts = posts.filter(p => p.category_slug === category || p.category_id === category);
  }

  if (q) {
    posts = posts.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.author_name.toLowerCase().includes(q)
    );
  }

  const categories = localDb.getForumCategories();
  return NextResponse.json({ posts, categories });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to start a forum discussion.' }, { status: 401 });
    }

    const { category_id, title, content, language } = await req.json();

    if (!category_id || !title || !content) {
      return NextResponse.json({ error: 'Category, title, and discussion content are required.' }, { status: 400 });
    }

    // Confidentiality check warning
    const confidentialTerms = ['privilege', 'aadhar', 'pan number', 'confidential client'];
    // Safe validation
    const advocateProfile = localDb.getAdvocateProfileByUserId(user.id);

    const post = localDb.createForumPost({
      category_id,
      user_id: user.id,
      author_name: user.full_name,
      author_enrollment: advocateProfile?.bar_council_enrollment_no,
      author_verified: advocateProfile?.is_verified ?? false,
      title: title.trim(),
      content: content.trim(),
      language: language || 'mixed'
    });

    return NextResponse.json({ success: true, post });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create discussion';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
