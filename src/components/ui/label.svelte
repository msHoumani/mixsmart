<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Props for the Label component.
   */
  type Props = {
    /** Additional class names */
    class?: string;
    /** Input association */
    for?: string;
  };

  let {
    class: className,
    children,
    ...rest
  }: Props & { children?: import("svelte").Snippet } & Record<string, unknown> = $props();

  /**
   * Compute the label class names.
   */
  const classes = $derived.by(() =>
    cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)
  );
</script>

<label {...rest} class={classes}>
  {@render children?.()}
</label>
