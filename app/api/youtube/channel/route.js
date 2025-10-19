import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getYouTubeClient } from '@/lib/youtube';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const youtube = getYouTubeClient(session.accessToken);
    const response = await youtube.channels.list({
      part: ['id'],
      mine: true,
      maxResults: 1,
    });

    const channelId = response.data.items?.[0]?.id || null;
    if (!channelId) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, channelId });
  } catch (error) {
    console.error('Error fetching channel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channel' },
      { status: 500 }
    );
  }
}
