<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Props for the CardTitle component.
   */
  type Props = {
    /** Additional class names */
    class?: string;
  };

  let { class: className, children }: Props & { children?: import("svelte").Snippet } = $props();

  /**
   * Compute the card title class names.
   */
  const classes = $derived.by(() => cn("text-lg font-semibold leading-none tracking-tight", className));
</script>

<h3 class={classes}>
  {@render children?.()}
</h3>
