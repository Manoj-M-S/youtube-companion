import { google } from 'googleapis';

export function getYouTubeClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
}
