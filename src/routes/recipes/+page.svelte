<script lang="ts">
  import { useQuery, useMutation } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import RecipeCard from "$components/recipe/RecipeCard.svelte";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Plus, Search, Sparkles } from "lucide-svelte";
  import { toast } from "$components/ui/toast";
  import type { RecipeVisibilityFilter } from "$convex/lib/types";

  const auth = useAuth();

  let searchQuery = $state("");
  let visibilityFilter = $state<RecipeVisibilityFilter>("public");

  const recipesQuery = useQuery(api.functions.recipes.listRecipes, () =>
    auth.isAuthenticated ? { visibility: visibilityFilter, search: searchQuery.trim() || undefined } : "skip"
  );

  const userProfileQuery = useQuery(api.auth.getUserProfile, () => (auth.isAuthenticated ? {} : "skip"));

  const toggleLike = useMutation(api.functions.social.toggleLike);
  const toggleFavorite = useMutation(api.functions.social.toggleFavorite);

  /**
   * Handle like button click for a recipe.
   *
   * @param recipeId - Recipe ID
   */
  const handleLike = async (recipeId: string) => {
    try {
      await toggleLike.mutate({ recipeId });
    } catch (error) {
      console.error("Failed to toggle like", error);
      toast.error("Failed to update like");
    }
  };

  /**
   * Handle favorite button click for a recipe.
   *
   * @param recipeId - Recipe ID
   */
  const handleFavorite = async (recipeId: string) => {
    try {
      await toggleFavorite.mutate({ recipeId });
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      toast.error("Failed to update favorite");
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-3xl font-bold">Cocktail Recipes</h1>
      <p class="text-sm text-muted-foreground">Discover creations from the MixSmart community.</p>
    </div>

    <div class="flex gap-2">
      <Button href="/recipes/create">
        <Plus class="mr-2 h-4 w-4" />
        Create Recipe
      </Button>
      <Button variant="secondary" href="/recipes/generate">
        <Sparkles class="mr-2 h-4 w-4" />
        AI Generate
      </Button>
    </div>
  </div>

  <div class="mb-6 flex flex-col gap-4 md:flex-row">
    <div class="relative max-w-md flex-1">
      <Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" placeholder="Search recipes..." class="pl-10" bind:value={searchQuery} />
    </div>

    <select class="rounded-md border px-3 py-2" bind:value={visibilityFilter}>
      <option value="public">Public</option>
      <option value="friends">Friends Only</option>
      <option value="mine">My Recipes</option>
      <option value="all">All Visible</option>
    </select>
  </div>

  {#if recipesQuery.isLoading}
    <div class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  {:else if recipesQuery.data}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each recipesQuery.data as recipeData (recipeData.recipe._id)}
        <RecipeCard
          recipe={recipeData.recipe}
          ingredients={recipeData.ingredients}
          userProfile={userProfileQuery.data}
          likeCount={recipeData.likeCount}
          isLiked={recipeData.isLiked}
          isFavorited={recipeData.isFavorited}
          onLike={() => handleLike(recipeData.recipe._id)}
          onFavorite={() => handleFavorite(recipeData.recipe._id)}
        />
      {/each}
    </div>

    {#if recipesQuery.data.length === 0}
      <div class="py-12 text-center text-muted-foreground">
        <p>No recipes found. Try a different search or create your first recipe!</p>
      </div>
    {/if}
  {/if}
</div>
