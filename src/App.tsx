import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { 
  Store, 
  createQuote, 
  confirmQuote, 
  calculateRate,
  InsertQuote, 
  Quote 
} from './lib/api.ts';

// Function to convert text to title case
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


function App() {
  const { user, loading } = useAuth();
  
  // Show loading spinner while user data is being loaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show login screen if no user
  if (!user) {
    return <Login />;
  }

  // If we have a user, the router (in main.tsx) will handle rendering the appropriate component
  return null;
}

export default App;
