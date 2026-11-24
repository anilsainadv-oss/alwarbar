import { NextResponse } from 'next/server';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';
import { advocateRepository } from '@/lib/db/repositories';
import { updateProfileSchema } from '@/lib/validation/schemas';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    let profile = await advocateRepository.getAdvocateProfileByUserId(user.id);
    if (!profile) {
      // Auto-create blank profile for authenticated advocate
      profile = await advocateRepository.updateAdvocateProfile(user.id, {
        user_id: user.id,
        bar_council_enrollment_no: 'R/331/1977',
        bar_association_name: 'District Bar Association, Alwar',
        court_practice_complex: 'District & Sessions Court, Alwar',
        chamber_address: '',
        experience_years: 1,
        practice_areas: ['Civil', 'Criminal'],
        bio_hindi: '',
        bio_english: '',
        is_verified: false,
        is_publicly_listed: true
      });
    }

    return NextResponse.json({
      profile,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Invalid profile data' },
        { status: 400 }
      );
    }

    const { full_name, phone, ...profileData } = parseResult.data;

    const updated = await advocateRepository.updateAdvocateProfile(
      user.id,
      profileData,
      { full_name, phone }
    );

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
