'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { Eye, ThumbsUp, MessageSquare, Edit, Loader2, StickyNote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function VideoDetails() {
  const { data: session } = useSession();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchVideo();
    }
  }, [session]);

  const fetchVideo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/youtube/video');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video');
      }

      setVideo(data.video);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Video Details</h2>
          <p className="text-gray-600 text-sm">Manage your latest YouTube video</p>
        </div>

        <div className="w-full">
          <Image
            src={video.snippet.thumbnails.high.url}
            alt={video.snippet.title}
            width={1280}
            height={720}
            className="w-full h-auto max-h-[40vh] object-contain rounded-lg"
            priority
          />
        </div>

        <div>
          <h3 className="text-xl font-bold mb-2">{video.snippet.title}</h3>
          <p className="text-sm text-gray-500">
            Published {new Date(video.snippet.publishedAt).toLocaleDateString()}
          </p>
        </div>

        {video.snippet.description && (
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-gray-600 whitespace-pre-wrap text-sm">
              {video.snippet.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Views</span>
            </div>
            <p className="text-xl font-bold">
              {parseInt(video.statistics.viewCount).toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Likes</span>
            </div>
            <p className="text-xl font-bold">
              {parseInt(video.statistics.likeCount).toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-gray-600">Comments</span>
            </div>
            <p className="text-xl font-bold">
              {parseInt(video.statistics.commentCount).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/edit">
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Video
            </Button>
          </Link>
          <Link href="/comments">
            <Button variant="secondary">
              <MessageSquare className="mr-2 h-4 w-4" />
              Comments
            </Button>
          </Link>
          <Link href="/notes">
            <Button variant="secondary">
              <StickyNote className="mr-2 h-4 w-4" />
              Notes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
