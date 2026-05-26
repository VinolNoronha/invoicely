import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-md p-4 w-full sm:w-1/2 md:w-1/4 lg:w-1/5 box-border mx-1">
      {/* Icon + title */}
      <div className="flex gap-2 items-center w-full">
        <Skeleton className="w-6 h-6 rounded-full shrink-0" />
        <Skeleton className="w-24 h-4 rounded" />
      </div>

      {/* Number */}
      <div className="bg-white w-full p-4 rounded-sm flex items-center justify-center min-h-[60px]">
        <Skeleton className="w-20 h-8 rounded" />
      </div>
    </div>
  );
};

const SkeletonHomeStats: React.FC = () => {
  return (
    <section className="grid grid-cols-1 pr-3 sm:flex flex-wrap justify-around gap-4 w-full px-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </section>
  );
};

export default SkeletonHomeStats;
