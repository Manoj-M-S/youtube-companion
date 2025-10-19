import AuthButton from './components/AuthButton';
import VideoDetails from './components/VideoDetails';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { Youtube } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-bold">YouTube Companion</h1>
          </div>
          <AuthButton />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {!session ? (
            <div className="text-center py-20">
              <Youtube className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-3">Welcome to YouTube Companion</h2>
              <p className="text-gray-600 max-w-lg mx-auto">
                Sign in with Google to manage your YouTube videos, respond to comments, and keep track of improvement ideas.
              </p>
            </div>
          ) : (
            <VideoDetails />
          )}
        </div>
      </div>
    </main>
  );
}
