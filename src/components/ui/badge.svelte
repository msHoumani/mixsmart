<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Supported badge variants.
   */
  type Variant = "default" | "secondary" | "outline";

  /**
   * Props for the Badge component.
   */
  type Props = {
    /** Optional badge variant */
    variant?: Variant;
    /** Additional class names */
    class?: string;
  };

  let { variant = "default", class: className, children }: Props & { children?: import("svelte").Snippet } = $props();

  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variantClasses: Record<Variant, string> = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input text-foreground"
  };

  /**
   * Compute the badge class names.
   */
  const classes = $derived.by(() => cn(baseClasses, variantClasses[variant], className));
</script>

<span class={classes}>
  {@render children?.()}
</span>
