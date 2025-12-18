<script lang="ts">
  import { useMutation } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { goto } from "$app/navigation";
  import { toast } from "$components/ui/toast";
  import { Button } from "$components/ui/button";
  import RecipeForm, { type RecipeFormData } from "$components/recipe/RecipeForm.svelte";

  const auth = useAuth();
  const createRecipe = useMutation(api.functions.recipes.createRecipe);

  /**
   * Submit a new recipe.
   *
   * @param data - Recipe form data
   */
  const handleCreate = async (data: RecipeFormData) => {
    try {
      const recipeId = await createRecipe.mutate({
        title: data.title,
        description: data.description,
        tasteProfiles: data.tasteProfiles,
        visibility: data.visibility,
        ingredients: data.ingredients,
        steps: data.steps
      });

      toast.success("Recipe created successfully!");
      await goto(`/recipes/${recipeId}`);
    } catch (error) {
      console.error("Failed to create recipe", error);
      toast.error("Failed to create recipe");
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Create Recipe</h1>
    <Button variant="ghost" href="/recipes">Back to Recipes</Button>
  </div>

  {#if auth.isAuthenticated}
    <RecipeForm onSubmit={handleCreate} isSubmitting={createRecipe.isLoading} submitLabel="Create Recipe" />
  {:else}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Sign in to create a recipe.</p>
      <div class="mt-4 flex justify-center">
        <Button href="/auth/login">Sign In</Button>
      </div>
    </div>
  {/if}
</div>
