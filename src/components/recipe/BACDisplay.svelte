<script lang="ts">
  import { calculateBACSummary } from "$convex/lib/bac";
  import { Badge } from "$components/ui/badge";
  import { AlertTriangle, Clock, Wine } from "lucide-svelte";
  import type { Doc } from "$convex/_generated/dataModel";

  /**
   * Props for the BACDisplay component.
   */
  type Props = {
    ingredients: Array<{ volumeInMl: number; abv: number }>;
    userProfile: Doc<"users">;
  };

  let { ingredients, userProfile }: Props = $props();

  /**
   * Calculate BAC summary if user profile data is complete.
   */
  const bacData = $derived(() => calculateBACSummary(ingredients, userProfile));

  /**
   * Map risk level to CSS classes.
   *
   * @param level - Risk level
   * @returns Tailwind class string
   */
  const getRiskColorClass = (level: "safe" | "caution" | "warning" | "danger"): string => {
    switch (level) {
      case "safe":
        return "border-green-500/40 text-green-700";
      case "caution":
        return "border-yellow-500/40 text-yellow-700";
      case "warning":
        return "border-orange-500/40 text-orange-700";
      case "danger":
      default:
        return "border-red-500/40 text-red-700";
    }
  };
</script>

{#if bacData}
  <div class="space-y-2 rounded-lg border p-3 {getRiskColorClass(bacData.riskLevel.level)}">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Wine class="h-4 w-4" />
        <span class="font-medium">Estimated BAC</span>
      </div>
      <Badge variant="outline" class={getRiskColorClass(bacData.riskLevel.level)}>
        {bacData.bacPercent}%
      </Badge>
    </div>

    <p class="flex items-center gap-1 text-sm">
      {#if bacData.riskLevel.level === "danger" || bacData.riskLevel.level === "warning"}
        <AlertTriangle class="h-4 w-4" />
      {/if}
      {bacData.riskLevel.message}
    </p>

    {#if bacData.bac > 0}
      <p class="flex items-center gap-1 text-xs opacity-75">
        <Clock class="h-3 w-3" />
        ~{bacData.hoursUntilSober.toFixed(1)} hours until sober
      </p>
    {/if}
  </div>
{:else}
  <div class="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
    <p>Add your weight and biological sex in profile settings to see BAC estimates.</p>
  </div>
{/if}
