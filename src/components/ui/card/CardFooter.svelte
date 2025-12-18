<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Props for the CardFooter component.
   */
  type Props = {
    /** Additional class names */
    class?: string;
  };

  let { class: className, children }: Props & { children?: import("svelte").Snippet } = $props();

  /**
   * Compute the card footer class names.
   */
  const classes = $derived.by(() => cn("flex items-center p-6 pt-0", className));
</script>

<div class={classes}>
  {@render children?.()}
</div>
