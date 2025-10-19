'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { ArrowLeft, Plus, Search, X, Trash2, Loader2, StickyNote, Tag } from 'lucide-react';
import Link from 'next/link';

function NotesPageContent() {
  const [notes, setNotes] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async (search = '', tags = []) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tags.length > 0) params.append('tags', tags.join(','));

      const response = await fetch(`/api/notes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setNotes(data.notes);
      setAllTags(data.allTags);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNotes(searchText, selectedTags);
  };

  const toggleTag = (tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    fetchNotes(searchText, newSelectedTags);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedTags([]);
    fetchNotes('', []);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          tags: newTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setNewContent('');
      setNewTags('');
      fetchNotes(searchText, selectedTags); // Refresh with current filters
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      fetchNotes(searchText, selectedTags); // Refresh with current filters
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && notes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading notes...</p>
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
              <StickyNote className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Video Notes</h1>
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
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Note & Search */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Note Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Note
                </CardTitle>
                <CardDescription>Track improvement ideas for your videos</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write your video improvement ideas..."
                    rows={5}
                    required
                  />
                  <Input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Tags (comma-separated)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: audio quality, thumbnail, intro
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting || !newContent.trim()}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Note
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Search & Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Search */}
                <form onSubmit={handleSearch} className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search notes..."
                    />
                    {searchText && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchText('');
                          fetchNotes('', selectedTags);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button type="submit" className="w-full" variant="secondary">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </form>

                {/* Tag Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Filter by Tags</h3>
                  </div>
                  {allTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer hover:scale-105 transition-transform"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                {(searchText || selectedTags.length > 0) && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notes List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Your Notes ({notes.length})
                    {(searchText || selectedTags.length > 0) && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (filtered)
                      </span>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-center py-12">
                    <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchText || selectedTags.length > 0
                        ? 'No notes match your search criteria'
                        : 'No notes yet. Add your first note!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <Card key={note._id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <p className="whitespace-pre-wrap mb-4 leading-relaxed">
                            {note.content}
                          </p>
                          
                          {/* Tags */}
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {note.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-3">
                            <span>
                              {new Date(note.createdAt).toLocaleDateString()} at{' '}
                              {new Date(note.createdAt).toLocaleTimeString()}
                            </span>
                            <Button
                              onClick={() => handleDeleteNote(note._id)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesPageContent />
    </ProtectedRoute>
  );
}
