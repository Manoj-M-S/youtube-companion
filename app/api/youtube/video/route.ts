import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getYouTubeClient } from '@/lib/youtube';
import dbConnect from '@/lib/mongodb';
import EventLog from '@/models/EventLog';

export async function GET(request: Request) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Get YouTube client
    const youtube = getYouTubeClient(session.accessToken);
    const videoId = process.env.YOUTUBE_VIDEO_ID;

    if (!videoId) {
      return NextResponse.json(
        { error: 'YOUTUBE_VIDEO_ID not configured' },
        { status: 500 }
      );
    }

    // Fetch video details
    const response = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const video = response.data.items[0];

    // Log event to database
    await dbConnect();
    await EventLog.create({
      userId: session.userId,
      action: 'fetch_video',
      videoId: videoId,
      details: {
        title: video.snippet?.title,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      video: video,
    });

  } catch (error: any) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
