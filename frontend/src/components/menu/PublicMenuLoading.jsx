import { LoadingIndicator } from '../application/loading-indicator/loading-indicator.jsx';

export default function PublicMenuLoading({ className = 'text-white', fullScreen = true }) {
  return (
    <div
      className={
        fullScreen
          ? `flex h-full min-h-[50vh] flex-1 items-center justify-center ${className}`
          : `flex items-center justify-center ${className}`
      }
    >
      <LoadingIndicator type="dot-circle" size="md" />
    </div>
  );
}
