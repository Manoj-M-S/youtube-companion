import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import EventLog from '@/models/EventLog';

// GET - Fetch notes with optional search and tag filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    // Build query
    let query = {
      userId: session.userId,
      videoId: videoId,
    };

    // Add text search if provided
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    // Add tag filter if provided
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      if (tagArray.length > 0) {
        query.tags = { $in: tagArray };
      }
    }

    // Fetch notes
    const notes = await Note.find(query).sort({ createdAt: -1 });

    // Get all unique tags for this video
    const allNotes = await Note.find({
      userId: session.userId,
      videoId: videoId,
    });
    
    const allTags = [...new Set(allNotes.flatMap(note => note.tags))];

    // Log event
    await EventLog.create({
      userId: session.userId,
      action: 'fetch_notes',
      videoId: videoId,
      details: {
        count: notes.length,
        search: search || null,
        tags: tags || null,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      notes: notes,
      allTags: allTags,
    });

  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content, tags } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    // Process tags - split by comma, trim whitespace, remove empty strings
    const processedTags = tags
      ? tags.split(',').map(t => t.trim()).filter(t => t)
      : [];

    // Create note
    const note = await Note.create({
      userId: session.userId,
      videoId: videoId,
      content: content,
      tags: processedTags,
    });

    // Log event
    await EventLog.create({
      userId: session.userId,
      action: 'create_note',
      videoId: videoId,
      details: {
        noteId: note._id,
        tags: processedTags,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      note: note,
    });

  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}
