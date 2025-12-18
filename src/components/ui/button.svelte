<script lang="ts">
  import { cn } from "$lib/utils";
  import { resolve } from "$app/paths";

  /**
   * Supported button visual variants.
   */
  type Variant = "default" | "secondary" | "outline" | "ghost";

  /**
   * Supported button sizes.
   */
  type Size = "sm" | "md" | "lg";

  /**
   * Props for the Button component.
   */
  type Props = {
    /** Optional button variant */
    variant?: Variant;
    /** Optional size variant */
    size?: Size;
    /** Optional link destination */
    href?: string;
    /** HTML button type */
    type?: "button" | "submit" | "reset";
    /** Disabled state */
    disabled?: boolean;
    /** Additional class names */
    class?: string;
  };

  let {
    variant = "default",
    size = "md",
    href,
    type = "button",
    disabled = false,
    class: className,
    children
  }: Props & { children?: import("svelte").Snippet } = $props();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variantClasses: Record<Variant, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };

  const sizeClasses: Record<Size, string> = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
    lg: "h-11 px-6"
  };

  /**
   * Build the final class string for the button element.
   */
  const classes = $derived.by(() =>
    cn(baseClasses, variantClasses[variant], sizeClasses[size], disabled && "opacity-60", className)
  );

  /**
   * Handle link clicks when rendered as an anchor element.
   *
   * @param event - Click event
   */
  const handleLinkClick = (event: MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
</script>

{#if href}
  <a
    class={classes}
    href={resolve(href)}
    aria-disabled={disabled}
    tabindex={disabled ? -1 : undefined}
    onclick={handleLinkClick}
  >
    {@render children?.()}
  </a>
{:else}
  <button class={classes} {type} {disabled}>
    {@render children?.()}
  </button>
{/if}
