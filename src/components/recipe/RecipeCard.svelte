<script lang="ts">
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$components/ui/card";
  import { Badge } from "$components/ui/badge";
  import { Button } from "$components/ui/button";
  import { Heart, Bookmark } from "lucide-svelte";
  import type { Doc } from "$convex/_generated/dataModel";
  import BACDisplay from "./BACDisplay.svelte";

  /**
   * Props for the RecipeCard component.
   */
  type Props = {
    /** Recipe document from Convex */
    recipe: Doc<"recipes">;
    /** Ingredients for the recipe */
    ingredients: Doc<"ingredients">[];
    /** Current user's profile for BAC calculation */
    userProfile?: Doc<"users"> | undefined;
    /** Like count for this recipe */
    likeCount: number;
    /** Whether current user has liked */
    isLiked: boolean;
    /** Whether current user has favorited */
    isFavorited: boolean;
    /** Callback when like button clicked */
    onLike: () => void;
    /** Callback when favorite button clicked */
    onFavorite: () => void;
  };

  let { recipe, ingredients, userProfile, likeCount, isLiked, isFavorited, onLike, onFavorite }: Props = $props();

  /**
   * Taste profile badge colors.
   */
  const tasteColors: Record<string, string> = {
    boozy: "bg-amber-500",
    sweet: "bg-pink-500",
    sour: "bg-yellow-500",
    bitter: "bg-orange-700",
    umami: "bg-purple-500",
    astringent: "bg-gray-500",
    hot: "bg-red-500",
    cold: "bg-blue-500"
  };
</script>

<Card class="w-full max-w-md transition-shadow hover:shadow-lg">
  <CardHeader>
    <CardTitle class="flex items-center justify-between">
      <span>{recipe.title}</span>
      {#if recipe.isAIGenerated}
        <Badge variant="secondary">AI Generated</Badge>
      {/if}
    </CardTitle>
    {#if recipe.description}
      <p class="text-sm text-muted-foreground">{recipe.description}</p>
    {/if}
  </CardHeader>

  <CardContent class="space-y-4">
    <div class="flex flex-wrap gap-2">
      {#each recipe.tasteProfiles as profile (profile)}
        <Badge class={tasteColors[profile] || "bg-gray-500"}>
          {profile}
        </Badge>
      {/each}
    </div>

    <div>
      <h4 class="mb-2 text-sm font-medium">Ingredients ({ingredients.length})</h4>
      <ul class="space-y-1 text-sm text-muted-foreground">
        {#each ingredients.slice(0, 3) as ingredient (ingredient._id)}
          <li>{ingredient.name} - {ingredient.volumeInMl}ml</li>
        {/each}
        {#if ingredients.length > 3}
          <li class="italic">+{ingredients.length - 3} more...</li>
        {/if}
      </ul>
    </div>

    {#if userProfile?.biologicalSex && userProfile?.weightInKg}
      <BACDisplay {ingredients} {userProfile} />
    {/if}
  </CardContent>

  <CardFooter class="flex justify-between">
    <div class="flex gap-2">
      <Button variant={isLiked ? "default" : "outline"} size="sm" onclick={onLike}>
        <Heart class="mr-1 h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
        {likeCount}
      </Button>

      <Button variant={isFavorited ? "default" : "outline"} size="sm" onclick={onFavorite}>
        <Bookmark class="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
      </Button>
    </div>

    <Button variant="ghost" size="sm" href={`/recipes/${recipe._id}`}>View Recipe</Button>
  </CardFooter>
</Card>
