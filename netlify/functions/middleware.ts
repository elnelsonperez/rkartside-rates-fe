import { Handler, HandlerResponse } from '@netlify/functions';

// Get auth credentials from environment variables
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
    
    // IMPORTANT: Special handling for the middleware itself to prevent redirect loops
    if (requestedPath.includes('/.netlify/functions/middleware')) {
      // If this is the middleware itself being called directly
      if (verifyBasicAuth(authHeader)) {
        // User is authenticated, serve the app directly
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html'
          },
          body: '<html><head><meta http-equiv="refresh" content="0;url=/"></head><body>Redirecting...</body></html>'
        };
      } else {
        // Not authenticated, ask for credentials
        return {
          statusCode: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store'
          },
          body: 'Authentication required'
        } as HandlerResponse;
      }
    }
    
    // For all other paths (non-middleware paths)
    
    // Some paths should bypass authentication
    const publicPaths = [
      '/assets/',
      '/favicon.ico',
      '/static/',
      '/_next/'
    ];

    // Check if the requested path should bypass authentication
    const isPublicPath = publicPaths.some(path => requestedPath.startsWith(path));
    
    if (isPublicPath) {
      console.log('Path exempt from auth, allowing access');
      return {
        statusCode: 200,
        body: '',
      };
    }

    // If auth is valid, serve the content
    if (verifyBasicAuth(authHeader)) {
      console.log('Authentication successful');
      return {
        statusCode: 200,
        body: '',
      };
    }

    // If auth fails, prompt for credentials
    console.log('Authentication failed, prompting for credentials');
    return {
      statusCode: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      },
      body: 'Authentication required',
    };
  } catch (error) {
    console.error('Middleware error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};