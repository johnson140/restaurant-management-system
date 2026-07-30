/**
 * Shared surface card. Pass `interactive` for clickable cards
 * (adds hover lift + pointer cursor) — e.g. metric cards, table tiles.
 */
export default function Card({
  interactive = false,
  children,
  className = "",
  style,
  ...rest
}) {
  const classes = ["ui-card", interactive ? "ui-card-interactive" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style} {...rest}>
      {children}
    </div>
  );
}
