<script lang="ts">
  import { page } from "$app/state";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { useMutation, useQuery } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { Badge } from "$components/ui/badge";
  import { Button } from "$components/ui/button";
  import { Heart, Bookmark } from "lucide-svelte";
  import BACDisplay from "$components/recipe/BACDisplay.svelte";
  import CommentSection from "$components/social/CommentSection.svelte";
  import IngredientSourcer from "$components/ai/IngredientSourcer.svelte";
  import { toast } from "$components/ui/toast";
  import type { Id } from "$convex/_generated/dataModel";

  const auth = useAuth();
  const recipeId = $derived.by(() => page.params.id as Id<"recipes">);

  const recipeQuery = useQuery(api.functions.recipes.getRecipe, () => (recipeId ? { recipeId } : "skip"));
  const userProfileQuery = useQuery(api.auth.getUserProfile, () => (auth.isAuthenticated ? {} : "skip"));

  const toggleLike = useMutation(api.functions.social.toggleLike);
  const toggleFavorite = useMutation(api.functions.social.toggleFavorite);

  /**
   * Toggle a like for the current recipe.
   */
  const handleLike = async () => {
    try {
      await toggleLike.mutate({ recipeId });
    } catch (error) {
      console.error("Failed to toggle like", error);
      toast.error("Failed to update like");
    }
  };

  /**
   * Toggle favorite for the current recipe.
   */
  const handleFavorite = async () => {
    try {
      await toggleFavorite.mutate({ recipeId });
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      toast.error("Failed to update favorite");
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  {#if recipeQuery.isLoading}
    <div class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  {:else if recipeQuery.data}
    {@const { recipe, ingredients, steps, likeCount, isLiked, isFavorited } = recipeQuery.data}

    <div class="space-y-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold">{recipe.title}</h1>
          {#if recipe.description}
            <p class="text-muted-foreground">{recipe.description}</p>
          {/if}
        </div>
        <div class="flex gap-2">
          <Button variant={isLiked ? "default" : "outline"} size="sm" onclick={handleLike}>
            <Heart class="mr-1 h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
            {likeCount}
          </Button>
          <Button variant={isFavorited ? "default" : "outline"} size="sm" onclick={handleFavorite}>
            <Bookmark class="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        {#each recipe.tasteProfiles as profile (profile)}
          <Badge>{profile}</Badge>
        {/each}
      </div>

      <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div class="space-y-6">
          <div class="rounded-lg border p-4">
            <h2 class="mb-2 text-lg font-semibold">Ingredients</h2>
            <ul class="space-y-2 text-sm">
              {#each ingredients as ingredient (ingredient._id)}
                <li class="flex items-center justify-between">
                  <span>{ingredient.name}</span>
                  <span class="text-muted-foreground">
                    {ingredient.volumeInMl}ml
                    {#if ingredient.abv > 0}
                      ({(ingredient.abv * 100).toFixed(0)}% ABV)
                    {/if}
                  </span>
                </li>
              {/each}
            </ul>
          </div>

          <div class="rounded-lg border p-4">
            <h2 class="mb-2 text-lg font-semibold">Preparation</h2>
            <ol class="space-y-2">
              {#each steps as step (step._id)}
                <li class="flex gap-2">
                  <span class="font-medium text-primary">{step.stepNumber}.</span>
                  <span>{step.description}</span>
                </li>
              {/each}
            </ol>
          </div>

          <CommentSection {recipeId} />
        </div>

        <div class="space-y-6">
          {#if userProfileQuery.data?.biologicalSex && userProfileQuery.data?.weightInKg}
            <BACDisplay {ingredients} userProfile={userProfileQuery.data} />
          {/if}

          <IngredientSourcer {recipeId} userZipCode={userProfileQuery.data?.zipCode} />
        </div>
      </div>
    </div>
  {:else}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Recipe not found or no longer available.</p>
    </div>
  {/if}
</div>
