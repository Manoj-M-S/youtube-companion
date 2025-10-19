import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getYouTubeClient } from '@/lib/youtube';
import dbConnect from '@/lib/mongodb';
import EventLog from '@/models/EventLog';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description } = await request.json();
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const youtube = getYouTubeClient(session.accessToken);
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID not configured' },
        { status: 500 }
      );
    }

    // CRITICAL: First fetch current video to get categoryId
    // YouTube requires categoryId when updating snippet
    const currentVideo = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    });

    if (!currentVideo.data.items || currentVideo.data.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const currentSnippet = currentVideo.data.items[0].snippet!;
    const categoryId = currentSnippet.categoryId;

    // Update video with new title and description
    const updateResponse = await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: {
          title: title,
          description: description,
          categoryId: categoryId, // REQUIRED - must include existing categoryId
          tags: currentSnippet.tags || [], // Preserve existing tags
        },
      },
    });

    // Log event
    await dbConnect();
    await EventLog.create({
      userId: session.userId,
      action: 'update_video',
      videoId: videoId,
      details: {
        oldTitle: currentSnippet.title,
        newTitle: title,
        oldDescription: currentSnippet.description,
        newDescription: description,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully',
      video: updateResponse.data,
    });

  } catch (error: any) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    );
  }
}
