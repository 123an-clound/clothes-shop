export default function ProductLoading() {
  return (
    <div className="mx-auto grid w-full max-w-screen-2xl gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[1.2fr_1fr]" aria-busy="true" aria-label="Đang tải sản phẩm">
      <div className="aspect-[4/5] animate-pulse bg-surface" />
      <div className="flex flex-col gap-4">
        <div className="h-14 w-3/4 animate-pulse bg-surface" />
        <div className="h-8 w-1/3 animate-pulse bg-surface" />
        <div className="mt-6 h-11 w-1/2 animate-pulse bg-surface" />
        <div className="h-11 w-2/3 animate-pulse bg-surface" />
      </div>
    </div>
  );
}
