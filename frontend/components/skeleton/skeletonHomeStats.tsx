import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCard: React.FC = () => {
  return (
    <div className="w-1/5 h-30/31 flex flex-col gap-3 bg-gray-50 rounded-md p-4">
      {/* Header */}
      <div className="flex gap-2 items-center w-full">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-20 h-4 rounded" />
      </div>

      {/* Content */}
      <div className="bg-white h-full w-full p-4 rounded-sm flex items-center justify-center">
        <Skeleton className="w-16 h-8 rounded" />
      </div>
    </div>
  );
};

const SkeletonHomeStats: React.FC = () => {
  return (
    <section className="flex items-center justify-around h-1/4 w-full">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </section>
  );
};

export default SkeletonHomeStats;
