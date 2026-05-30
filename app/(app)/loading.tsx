export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="shimmer h-12 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <div className="shimmer h-28 rounded-2xl" />
          <div className="shimmer h-[420px] rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="shimmer h-64 rounded-2xl" />
          <div className="shimmer h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
