/**
 * Shared Button.
 * variant: "primary" | "customer" | "secondary" | "danger" | "ghost"
 * size: "md" (default) | "sm"
 * loading: shows a spinner in place of the label without resizing the button.
 *
 * "customer" variant is the only place the orange accent should be used —
 * keep staff/admin buttons on "primary" (blue) so the two experiences
 * stay visually related but distinct on purpose.
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  block = false,
  icon = null,
  children,
  className = "",
  ...rest
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span style={{ opacity: 0.85 }}>{children}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
