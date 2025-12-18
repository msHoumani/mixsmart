<script lang="ts">
  import { toastStore, removeToast, type ToastItem } from "$components/ui/toast";
  import { cn } from "$lib/utils";

  /**
   * Determine toast color classes by variant.
   *
   * @param toast - Toast item
   * @returns Class string
   */
  const getVariantClasses = (toast: ToastItem): string => {
    switch (toast.variant) {
      case "success":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
      case "error":
        return "border-red-500/40 bg-red-500/10 text-red-100";
      case "info":
      default:
        return "border-blue-500/40 bg-blue-500/10 text-blue-100";
    }
  };
</script>

<div class="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
  {#each $toastStore as toast (toast.id)}
    <div
      class={cn(
        "pointer-events-auto rounded-lg border px-4 py-3 shadow-lg backdrop-blur",
        "animate-in fade-in slide-in-from-top-2",
        getVariantClasses(toast)
      )}
      role="status"
      aria-live="polite"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold">{toast.title}</p>
          {#if toast.description}
            <p class="mt-1 text-xs opacity-80">{toast.description}</p>
          {/if}
        </div>
        <button
          type="button"
          class="text-xs tracking-wide uppercase opacity-70 transition hover:opacity-100"
          onclick={() => removeToast(toast.id)}
        >
          Close
        </button>
      </div>
    </div>
  {/each}
</div>
