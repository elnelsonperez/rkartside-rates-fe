import {Handler, HandlerResponse} from '@netlify/functions';

// Get auth credentials from environment variables
// Netlify makes environment variables available directly
const AUTH_USERNAME = process.env.VITE_AUTH_USERNAME || 'storeAdmin';
const AUTH_PASSWORD = process.env.VITE_AUTH_PASSWORD || 'securePassword123';

// Function to verify basic auth
const verifyBasicAuth = (authHeader: string | undefined): boolean => {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    // Extract and decode the base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

    return username === AUTH_USERNAME && password === AUTH_PASSWORD;
  } catch (error) {
    console.error('Auth verification error:', error);
    return false;
  }
};

export const handler: Handler = async (event) => {
  console.log('Middleware function invoked');
  
  try {
    const authHeader = event.headers.authorization;
    const requestedPath = event.path || '/';
    
    // Log request info for debugging
    console.log(`Request path: ${requestedPath}`);
    console.log(`Auth header present: ${!!authHeader}`);

    // Paths that should bypass authentication
    const publicPaths = [
      '/assets/',
      '/.netlify/functions/', // Allow access to functions
      '/favicon.ico'
    ];

    // Check if the requested path should bypass authentication
    const isPublicPath = publicPaths.some(path => requestedPath.startsWith(path));
    
    if (isPublicPath) {
      console.log('Path exempt from auth, allowing access');
      return {
        statusCode: 200,
        body: '',
      } as HandlerResponse;
    }

    // If auth is valid, redirect to the requested page
    if (verifyBasicAuth(authHeader)) {
      console.log('Authentication successful, redirecting');
      return {
        statusCode: 303,
        headers: {
          'Location': requestedPath
        },
        body: ''
      } as HandlerResponse;
    }

    // If auth fails, prompt for credentials
    console.log('Authentication failed, prompting for credentials');
    return {
      statusCode: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
        'Content-Type': 'text/plain',
      },
      body: 'Authentication required',
    } as HandlerResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    } as HandlerResponse;
  }
};