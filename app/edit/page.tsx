'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ArrowLeft, Save, Loader2, CheckCircle2, Youtube } from 'lucide-react';
import Link from 'next/link';

function EditVideoContent() {
  const router = useRouter();
  const [video, setVideo] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, []);

  const fetchVideo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/youtube/video');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setVideo(data.video);
      setTitle(data.video.snippet.title);
      setDescription(data.video.snippet.description);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/youtube/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading video details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Youtube className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Edit Video</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Update Video Details</CardTitle>
            <CardDescription>Edit your video&apos;s title and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Video updated successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Error:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Video Thumbnail */}
            {video && (
              <div className="relative overflow-hidden rounded-lg border">
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Video Title
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  required
                  maxLength={100}
                />
                <p className="text-sm text-muted-foreground">
                  {title.length}/100 characters
                </p>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Video Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description"
                  rows={10}
                  required
                  maxLength={5000}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {description.length}/5000 characters
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Video
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditVideo() {
  return (
    <ProtectedRoute>
      <EditVideoContent />
    </ProtectedRoute>
  );
}
