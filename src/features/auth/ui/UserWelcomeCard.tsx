type UserWelcomeCardProps = {
  id: string;
  name: string;
  image?: string | null;
};

export function UserWelcomeCard({ id, name, image }: UserWelcomeCardProps) {
  return (
    <section className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-center gap-3">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${name} avatar`}
            className="size-12 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">Discord ID: {id}</p>
        </div>
      </div>
    </section>
  );
}
