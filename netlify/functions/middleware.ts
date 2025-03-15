import {Handler, HandlerResponse} from '@netlify/functions';
import * as dotenv from 'dotenv';

dotenv.config();

// For ESM compatibility with CommonJS for testing
export const __esModule = true;

// Get auth credentials from environment variables
const AUTH_USERNAME = process.env.VITE_AUTH_USERNAME || 'storeAdmin';
const AUTH_PASSWORD = process.env.VITE_AUTH_PASSWORD || 'securePassword123';

// Function to verify basic auth
const verifyBasicAuth = (authHeader: string | undefined) => {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  // Extract and decode the base64 credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  return username === AUTH_USERNAME && password === AUTH_PASSWORD;
};

export const handler: Handler = async (event) => {
  const authHeader = event.headers.authorization;

  // Paths that should bypass authentication (assets, etc.)
  const publicPaths = [
    '/assets/',
  ];

  // Check if the requested path should bypass authentication
  const requestedPath = event.path;
  const isPublicPath = publicPaths.some(path => requestedPath.startsWith(path));

  if (isPublicPath) {
    // Pass through to the requested path
    return {
      statusCode: 200,
      body: '',
    } as HandlerResponse;
  }

  // If auth is valid, redirect to the requested page
  if (verifyBasicAuth(authHeader)) {
    return {
      statusCode: 303,
      headers: {
        'Location': requestedPath || '/'
      },
      body: ''
    };
  }

  // If auth fails, prompt for credentials
  return {
    statusCode: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
      'Content-Type': 'text/plain',
    },
    body: 'Authentication required',
  };
};