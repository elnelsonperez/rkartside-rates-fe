interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({ 
  fullScreen = true, 
  size = 'medium' 
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeClasses = {
    small: 'h-8 w-8 border-t-2 border-b-2',
    medium: 'h-12 w-12 border-t-2 border-b-2',
    large: 'h-16 w-16 border-t-3 border-b-3',
  };

  // If fullScreen, center the spinner on the full screen
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-500`}
        ></div>
      </div>
    );
  }
  
  // Otherwise just return the spinner itself
  return (
    <div className="flex items-center justify-center p-4">
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-500`}
      ></div>
    </div>
  );
}