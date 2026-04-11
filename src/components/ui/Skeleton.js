export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCircle({ className = '' }) {
  return <div className={`skeleton rounded-full ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonCircle className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-1/5 h-3" />
        </div>
      </div>
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-4/5" />
      <SkeletonLine className="w-2/3 h-3" />
    </div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-8 flex flex-col items-center space-y-4">
      <SkeletonCircle className="w-24 h-24" />
      <SkeletonLine className="w-40 h-6" />
      <SkeletonLine className="w-28 h-4" />
      <div className="w-full space-y-3 mt-4">
        <SkeletonLine className="w-full h-12" />
        <SkeletonLine className="w-full h-12" />
        <SkeletonLine className="w-full h-12" />
      </div>
    </div>
  );
}

export function ConnectionSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <SkeletonCircle className="w-12 h-12" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-1/4 h-3" />
          </div>
          <div className="skeleton w-20 h-9 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
