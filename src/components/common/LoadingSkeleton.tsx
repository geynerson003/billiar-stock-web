interface LoadingSkeletonProps {
  /** Number of skeleton rows to render */
  rows?: number;
  /** Height of each skeleton element in px */
  height?: number;
  /** Optional class for the container */
  className?: string;
}

/**
 * Shimmer skeleton loader for content placeholders.
 * Renders animated rectangles that mimic loading content.
 */
export function LoadingSkeleton({
  rows = 3,
  height = 48,
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div className={`stack-list ${className}`}>
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="skeleton"
          key={index}
          style={{
            height: `${height}px`,
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
