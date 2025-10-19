import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getYouTubeClient } from '@/lib/youtube';
import dbConnect from '@/lib/mongodb';
import EventLog from '@/models/EventLog';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { commentId } = params;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const youtube = getYouTubeClient(session.accessToken);
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    // Delete comment
    await youtube.comments.delete({
      id: commentId,
    });

    // Log event
    await dbConnect();
    await EventLog.create({
      userId: session.userId,
      action: 'delete_comment',
      videoId: videoId,
      details: {
        commentId: commentId,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
