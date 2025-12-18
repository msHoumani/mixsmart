<script lang="ts">
  import { cn } from "$lib/utils";

  /**
   * Props for the Textarea component.
   */
  type Props = {
    /** Bound value */
    value?: string | undefined;
    /** Additional class names */
    class?: string;
  };

  let { value = $bindable(), class: className, ...rest }: Props & Record<string, unknown> = $props();

  /**
   * Compute the textarea class names.
   */
  const classes = $derived.by(() =>
    cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )
  );
</script>

<textarea {...rest} class={classes} bind:value></textarea>
