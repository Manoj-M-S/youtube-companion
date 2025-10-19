# YouTube Companion

A Next.js application for managing YouTube video content with note-taking and comment management capabilities.

## Architecture

**Tech Stack:**
- **Frontend:** Next.js 15, React 19, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js with Google OAuth
- **External API:** YouTube Data API v3

**Flow:**
1. User authenticates via Google OAuth with YouTube scope
2. Access token stored in JWT session
3. API routes validate session and interact with YouTube API
4. User actions logged to MongoDB for audit trail
5. Notes stored per user/video with tagging support

## Setup

```bash
# Install dependencies
npm install

# Configure environment variables
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
YOUTUBE_VIDEO_ID=target_video_id

# Run development server
npm run dev
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication handler

### YouTube Video
- `GET /api/youtube/video` - Fetch video details (snippet, statistics, contentDetails)
- `PUT /api/youtube/update` - Update video title and description

### Comments
- `GET /api/youtube/comments` - List all comments for the video
- `POST /api/youtube/comments` - Add new comment or reply
  - Body: `{ text, parentId? }`

### Notes
- `GET /api/notes` - Fetch notes with optional filters
  - Query params: `search`, `tags`
- `POST /api/notes` - Create new note
  - Body: `{ content, tags }`
- `DELETE /api/notes/[noteId]` - Delete specific note

## Database Schema

### Note
```javascript
{
  userId: String (indexed),
  videoId: String (indexed),
  content: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### EventLog
```javascript
{
  userId: String,
  action: String,
  videoId: String,
  details: Mixed,
  timestamp: Date
}
```

## Key Features

- **OAuth Integration:** Secure Google authentication with YouTube API access
- **Video Management:** View and update video metadata
- **Comment System:** Read and post comments/replies
- **Note Taking:** Create, search, and tag notes per video
- **Activity Logging:** Track all user actions for analytics
- **Session Management:** JWT-based sessions with access token refresh

## Project Structure

```
app/
├── api/
│   ├── auth/[...nextauth]/    # Authentication
│   ├── youtube/               # YouTube API routes
│   └── notes/                 # Notes CRUD operations
lib/
├── mongodb.ts                 # Database connection
└── youtube.ts                 # YouTube client factory
models/
├── Note.ts                    # Note schema
└── EventLog.ts                # Event log schema
```
