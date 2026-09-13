import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <div className="rounded-xl border p-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-4 h-[250px] w-full" />
        </div>
      </div>
    </>
  );
}
