import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth/guards';

const DATA_FILE = path.join(process.cwd(), 'data', 'bar-association-data.json');

function getData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { members: [], gallery: [] };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading bar-association-data.json:', err);
    return { members: [], gallery: [] };
  }
}

function saveData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving bar-association-data.json:', err);
    return false;
  }
}

// GET: Fetch all members (separated into current & previous)
export async function GET(req: NextRequest) {
  try {
    const data = getData();
    const searchParams = req.nextUrl.searchParams;
    const tenure = searchParams.get('tenure');
    const wing = searchParams.get('wing');
    const search = searchParams.get('q')?.toLowerCase() || '';

    let members = data.members || [];

    if (tenure) {
      members = members.filter((m: any) => m.tenure === tenure);
    }
    if (wing && wing !== 'all') {
      members = members.filter((m: any) => m.wing && m.wing.toLowerCase().includes(wing.toLowerCase()));
    }
    if (search) {
      members = members.filter((m: any) => 
        (m.name && m.name.toLowerCase().includes(search)) ||
        (m.enrolment_no && m.enrolment_no.toLowerCase().includes(search)) ||
        (m.membership_no && m.membership_no.toLowerCase().includes(search)) ||
        (m.role_title && m.role_title.toLowerCase().includes(search)) ||
        (m.phone && m.phone.includes(search))
      );
    }

    const currentMembers = members.filter((m: any) => m.is_current);
    const previousMembers = members.filter((m: any) => !m.is_current);

    return NextResponse.json({
      success: true,
      currentMembers,
      previousMembers,
      allMembers: members,
      total: members.length
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add new member (Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'public_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Only Bar Association Administrators can add members.' 
      }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name || !body.enrolment_no || !body.role_title) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: Name, Enrolment No, and Role Title are mandatory.' 
      }, { status: 400 });
    }

    const data = getData();
    const newMember = {
      id: `mem-${Date.now()}`,
      name: body.name.trim(),
      enrolment_no: body.enrolment_no.trim(),
      membership_no: body.membership_no ? body.membership_no.trim() : `ALW-${Date.now().toString().slice(-4)}`,
      role_title: body.role_title.trim(),
      tenure: body.tenure ? body.tenure.trim() : (body.is_current ? '2024–2026' : 'Previous'),
      is_current: body.is_current !== undefined ? Boolean(body.is_current) : true,
      wing: body.wing ? body.wing.trim() : 'General Bar',
      phone: body.phone ? body.phone.trim() : '',
      email: body.email ? body.email.trim() : '',
      chamber: body.chamber ? body.chamber.trim() : '',
      standing_years: body.standing_years ? body.standing_years.toString().trim() : '',
      photo_url: body.photo_url ? body.photo_url.trim() : '',
      created_at: new Date().toISOString()
    };

    data.members = [newMember, ...(data.members || [])];
    saveData(data);

    return NextResponse.json({ success: true, member: newMember });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Edit existing member (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'public_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Only Bar Association Administrators can edit members.' 
      }, { status: 403 });
    }

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Member ID is required.' }, { status: 400 });
    }

    const data = getData();
    const index = (data.members || []).findIndex((m: any) => m.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 });
    }

    data.members[index] = {
      ...data.members[index],
      ...body,
      updated_at: new Date().toISOString()
    };
    saveData(data);

    return NextResponse.json({ success: true, member: data.members[index] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete member (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'public_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Only Bar Association Administrators can delete members.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required.' }, { status: 400 });
    }

    const data = getData();
    data.members = (data.members || []).filter((m: any) => m.id !== id);
    saveData(data);

    return NextResponse.json({ success: true, message: 'Member deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
