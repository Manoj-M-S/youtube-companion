import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import EventLog from '@/models/EventLog';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { noteId } = params;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    // Find and delete note (ensure it belongs to the user)
    const deletedNote = await Note.findOneAndDelete({
      _id: noteId,
      userId: session.userId,
    });

    if (!deletedNote) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 404 }
      );
    }

    // Log event
    await EventLog.create({
      userId: session.userId,
      action: 'delete_note',
      videoId: videoId,
      details: {
        noteId: noteId,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}
