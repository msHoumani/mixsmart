<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Props for the CardHeader component.
   */
  type Props = {
    /** Additional class names */
    class?: string;
  };

  let { class: className, children }: Props & { children?: import("svelte").Snippet } = $props();

  /**
   * Compute the card header class names.
   */
  const classes = $derived.by(() => cn("flex flex-col space-y-1.5 p-6", className));
</script>

<div class={classes}>
  {@render children?.()}
</div>
