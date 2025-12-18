<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Props for the Input component.
   */
  type Props = {
    /** Input type attribute */
    type?: string;
    /** Bound value */
    value?: string | number | undefined;
    /** Additional class names */
    class?: string;
  };

  let { type = "text", value = $bindable(), class: className, ...rest }: Props & Record<string, unknown> = $props();

  /**
   * Compute the input class names.
   */
  const classes = $derived.by(() =>
    cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )
  );
</script>

<input {...rest} class={classes} {type} bind:value />
