<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Props for the Card component.
   */
  type Props = {
    /** Additional class names */
    class?: string;
  };

  let { class: className, children }: Props & { children?: import("svelte").Snippet } = $props();

  /**
   * Compute the card class names.
   */
  const classes = $derived.by(() => cn("rounded-lg border bg-card text-card-foreground shadow-sm", className));
</script>

<div class={classes}>
  {@render children?.()}
</div>
