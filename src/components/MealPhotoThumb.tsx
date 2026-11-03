export function MealPhotoThumb({
  src,
  alt,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- meal photos are local API or Supabase URLs
    <img
      src={src}
      alt={alt}
      className={`h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-teal-900/10 ${className}`}
      loading="lazy"
    />
  );
}
