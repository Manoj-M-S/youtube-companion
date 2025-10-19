import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getYouTubeClient } from '@/lib/youtube';
import dbConnect from '@/lib/mongodb';
import EventLog from '@/models/EventLog';

// GET - List all comments for the video
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const youtube = getYouTubeClient(session.accessToken);
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    // Fetch comment threads (top-level comments with replies)
    const response = await youtube.commentThreads.list({
      part: ['snippet', 'replies'],
      videoId: videoId,
      maxResults: 100,
      order: 'time', // Most recent first
    });

    // Log event
    await dbConnect();
    await EventLog.create({
      userId: session.userId,
      action: 'fetch_comments',
      videoId: videoId,
      details: {
        count: response.data.items?.length || 0,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      comments: response.data.items || [],
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Add a new comment or reply to existing comment
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { text, parentId } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const youtube = getYouTubeClient(session.accessToken);
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    let response;
    let action;

    if (parentId) {
      // Reply to existing comment
      response = await youtube.comments.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            parentId: parentId,
            textOriginal: text,
          },
        },
      });
      action = 'reply_comment';
    } else {
      // Create new top-level comment
      response = await youtube.commentThreads.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            videoId: videoId,
            topLevelComment: {
              snippet: {
                textOriginal: text,
              },
            },
          },
        },
      });
      action = 'add_comment';
    }

    // Log event
    await dbConnect();
    await EventLog.create({
      userId: session.userId,
      action: action,
      videoId: videoId,
      details: {
        text: text,
        parentId: parentId || null,
        commentId: response.data.id,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      comment: response.data,
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}
