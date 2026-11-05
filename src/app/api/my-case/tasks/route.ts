import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import { getCurrentUser, assertAuthenticated } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const tasks = localDb.getTasks(user.id);
    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { case_id, title, due_date, priority } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'Task title is required.' }, { status: 400 });
    }

    const task = localDb.createTask(user.id, {
      case_id: case_id || undefined,
      title: title.trim(),
      due_date: due_date || undefined,
      priority: priority || 'medium',
      status: 'pending'
    });

    return NextResponse.json({ success: true, task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    assertAuthenticated(user);

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Task ID and status required' }, { status: 400 });
    }

    const ok = localDb.updateTaskStatus(user.id, id, status);
    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
