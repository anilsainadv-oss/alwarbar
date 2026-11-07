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

// GET: Fetch all gallery images
export async function GET(req: NextRequest) {
  try {
    const data = getData();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let gallery = data.gallery || [];
    if (category && category !== 'all') {
      gallery = gallery.filter((item: any) => item.category === category);
    }

    const sliderImages = (data.gallery || []).filter((item: any) => item.is_slider);

    return NextResponse.json({
      success: true,
      gallery,
      sliderImages,
      total: gallery.length
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add new photo to gallery / slider (Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'public_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Only Bar Association Administrators can upload gallery images.' 
      }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.image_url) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and Image URL are required.' 
      }, { status: 400 });
    }

    const data = getData();
    const newImage = {
      id: `gal-${Date.now()}`,
      title: body.title.trim(),
      description: body.description ? body.description.trim() : '',
      category: body.category ? body.category.trim() : 'events',
      image_url: body.image_url.trim(),
      event_date: body.event_date ? body.event_date.trim() : new Date().toISOString().split('T')[0],
      is_slider: Boolean(body.is_slider),
      created_at: new Date().toISOString()
    };

    data.gallery = [newImage, ...(data.gallery || [])];
    saveData(data);

    return NextResponse.json({ success: true, image: newImage });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete photo (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'public_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Only Bar Association Administrators can delete images.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Image ID is required.' }, { status: 400 });
    }

    const data = getData();
    data.gallery = (data.gallery || []).filter((item: any) => item.id !== id);
    saveData(data);

    return NextResponse.json({ success: true, message: 'Image deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
