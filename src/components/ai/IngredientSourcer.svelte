<script lang="ts">
  import { useAction, useQuery } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { Card, CardContent, CardHeader, CardTitle } from "$components/ui/card";
  import { Badge } from "$components/ui/badge";
  import { MapPin, Search, ExternalLink, RefreshCw, Check, AlertCircle } from "lucide-svelte";
  import { toast } from "$components/ui/toast";
  import { resolve } from "$app/paths";
  import type { Id } from "$convex/_generated/dataModel";

  /**
   * Props for the IngredientSourcer component.
   */
  type Props = {
    recipeId: Id<"recipes">;
    userZipCode?: string;
  };

  let { recipeId, userZipCode }: Props = $props();

  let zipCode = $state(userZipCode || "");
  let currentRunId = $state<Id<"ingredientSearchRuns"> | undefined>(undefined);

  const sourceIngredients = useAction(api.agents.ingredientSourcer.sourceIngredientsForRecipe);

  const searchRunQuery = useQuery(api.functions.search.getSearchRunWithResults, () =>
    currentRunId ? { runId: currentRunId } : "skip"
  );

  /**
   * Start ingredient sourcing for the recipe.
   */
  const handleSearch = async () => {
    if (!zipCode || zipCode.length !== 5) {
      toast.error("Please enter a valid 5-digit ZIP code");
      return;
    }

    try {
      const result = await sourceIngredients.call({
        recipeId,
        zipCode
      });

      currentRunId = result.runId;
      toast.success("Ingredient search started!");
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to start ingredient search");
    }
  };

  /**
   * Get confidence badge color based on score.
   *
   * @param confidence - Match confidence score
   * @returns Tailwind color class
   */
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.5) return "bg-yellow-500";
    return "bg-orange-500";
  };
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <MapPin class="h-5 w-5" />
      Find Ingredients Near You
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <div class="flex gap-3">
      <div class="flex-1">
        <Label for="zipCode" class="sr-only">ZIP Code</Label>
        <Input id="zipCode" placeholder="Enter ZIP code (e.g., 90210)" maxlength={5} bind:value={zipCode} />
      </div>
      <Button onclick={handleSearch} disabled={sourceIngredients.isLoading}>
        {#if sourceIngredients.isLoading}
          <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
          Searching...
        {:else}
          <Search class="mr-2 h-4 w-4" />
          Find
        {/if}
      </Button>
    </div>

    {#if searchRunQuery.data}
      {@const { run, results } = searchRunQuery.data}

      <div
        class="flex items-center gap-2 rounded-lg p-3 {run.status === 'completed'
          ? 'bg-green-100 text-green-800'
          : run.status === 'failed'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'}"
      >
        {#if run.status === "completed"}
          <Check class="h-4 w-4" />
          <span>Search completed! Found products for {results.length} ingredients.</span>
        {:else if run.status === "failed"}
          <AlertCircle class="h-4 w-4" />
          <span>Search failed: {run.errorMessage || "Unknown error"}</span>
        {:else}
          <RefreshCw class="h-4 w-4 animate-spin" />
          <span>Searching for ingredients...</span>
        {/if}
      </div>

      {#if results.length > 0}
        <div class="space-y-4">
          {#each results as result (result._id)}
            <div class="rounded-lg border p-4">
              <h4 class="mb-3 font-medium">{result.ingredientName}</h4>

              {#if result.products.length > 0}
                <ul class="space-y-2">
                  {#each result.products.slice(0, 3) as product, index (index)}
                    <li class="flex items-start justify-between gap-4 rounded bg-muted p-2">
                      <div class="flex-1">
                        <a
                          href={resolve(`/outbound?url=${encodeURIComponent(product.url)}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          {product.title}
                          <ExternalLink class="h-3 w-3" />
                        </a>
                        <div class="mt-1 flex gap-3 text-sm text-muted-foreground">
                          {#if product.priceText}
                            <span>{product.priceText}</span>
                          {/if}
                          {#if product.sizeText}
                            <span>{product.sizeText}</span>
                          {/if}
                        </div>
                      </div>
                      <Badge class={getConfidenceColor(product.confidence)}>
                        {Math.round(product.confidence * 100)}% match
                      </Badge>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-sm text-muted-foreground">No products found for this ingredient.</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    <p class="text-xs text-muted-foreground">
      Results are sourced from Total Wine. Prices and availability may vary. Save your search to reference later.
    </p>
  </CardContent>
</Card>
