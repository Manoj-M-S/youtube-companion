'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, MessageSquare, Send, Reply, Trash2, Loader2, User } from 'lucide-react';
import Link from 'next/link';

function CommentsPageContent() {
  const [comments, setComments] = useState([]);
  const [session, setSession] = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
    // Get session from SessionProvider context if needed for isMyComment check
    fetch('/api/auth/session').then(res => res.json()).then(data => setSession(data));
    // Also fetch the authenticated user's YouTube channel ID for ownership checks
    fetch('/api/youtube/channel')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch channel')))
      .then(data => setChannelId(data.channelId))
      .catch(() => {});
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/youtube/comments');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setComments(data.comments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/youtube/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setNewComment('');
      // Optimistically prepend the new thread
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
      } else if (data.comments) {
        setComments((prev) => [data.comments, ...prev]);
      }
      // Background refresh to ensure consistency
      fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/youtube/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyText,
          parentId: parentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setReplyText('');
      setReplyingTo(null);
      // Optimistically append the reply to the right thread
      if (data.comment) {
        setComments((prev) => prev.map((thread) => {
          const topId = thread?.snippet?.topLevelComment?.id;
          if (topId !== parentId) return thread;
          const existingReplies = thread.replies?.comments || [];
          return {
            ...thread,
            replies: { comments: [...existingReplies, data.comment] },
          };
        }));
      }
      // Background refresh to ensure consistency
      fetchComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/youtube/comments/${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      fetchComments(); // Refresh comments list
    } catch (err) {
      setError(err.message);
    }
  };

  const isMyComment = (comment) => {
    if (!channelId) return false;
    const authorChannelId = comment.snippet.authorChannelId?.value;
    const authorChannelUrl = comment.snippet.authorChannelUrl;

    if (authorChannelId === channelId) return true;
    if (authorChannelUrl) {
      const urlChannelId = authorChannelUrl.split('/channel/')[1];
      if (urlChannelId === channelId) return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Manage Comments</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Add New Comment Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Add New Comment
            </CardTitle>
            <CardDescription>Post a comment on your video</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddComment} className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                required
              />
              <Button
                type="submit"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Comments List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>
          </div>
          
          {comments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </CardContent>
            </Card>
          ) : (
            comments.map((thread) => {
              const topComment = thread.snippet.topLevelComment;
              const topCommentId = topComment.id;
              const replies = thread.replies?.comments || [];

              return (
                <Card key={thread.id}>
                  <CardContent className="pt-6">
                    {/* Top-level Comment */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {topComment.snippet.authorProfileImageUrl ? (
                          <img
                            src={topComment.snippet.authorProfileImageUrl}
                            alt={topComment.snippet.authorDisplayName}
                            className="w-10 h-10 rounded-full border-2 border-primary/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">
                            {topComment.snippet.authorDisplayName}
                          </span>
                          {isMyComment(topComment) && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(topComment.snippet.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap mb-3 leading-relaxed">
                          {topComment.snippet.textDisplay}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setReplyingTo(replyingTo === topCommentId ? null : topCommentId)}
                            variant="ghost"
                            size="sm"
                          >
                            <Reply className="mr-2 h-4 w-4" />
                            Reply
                          </Button>
                          {isMyComment(topComment) && (
                            <Button
                              onClick={() => handleDeleteComment(topCommentId)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          )}
                        </div>

                        {/* Reply Form */}
                        {replyingTo === topCommentId && (
                          <Card className="mt-4 bg-muted/30">
                            <CardContent className="pt-4">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                rows={2}
                                className="mb-3"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReply(topCommentId)}
                                  disabled={submitting || !replyText.trim()}
                                  size="sm"
                                >
                                  {submitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Replying...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-3 w-3" />
                                      Reply
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="mt-4 ml-4 border-l-2 border-border pl-4 space-y-4">
                            {replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="flex-shrink-0">
                                  {reply.snippet.authorProfileImageUrl ? (
                                    <img
                                      src={reply.snippet.authorProfileImageUrl}
                                      alt={reply.snippet.authorDisplayName}
                                      className="w-8 h-8 rounded-full border-2 border-primary/20"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="h-4 w-4 text-primary" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold text-sm">
                                      {reply.snippet.authorDisplayName}
                                    </span>
                                    {isMyComment(reply) && (
                                      <Badge variant="secondary" className="text-xs">You</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(reply.snippet.publishedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {reply.snippet.textDisplay}
                                  </p>
                                  {isMyComment(reply) && (
                                    <Button
                                      onClick={() => handleDeleteComment(reply.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 text-destructive hover:text-destructive h-auto py-1 px-2"
                                    >
                                      <Trash2 className="mr-1 h-3 w-3" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

export default function CommentsPage() {
  return (
    <ProtectedRoute>
      <CommentsPageContent />
    </ProtectedRoute>
  );
}
