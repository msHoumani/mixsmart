<script lang="ts">
  import { useAction, useMutation } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { Textarea } from "$components/ui/textarea";
  import { Card, CardContent, CardHeader, CardTitle } from "$components/ui/card";
  import { Badge } from "$components/ui/badge";
  import { Sparkles, Save, RefreshCw, Check } from "lucide-svelte";
  import { toast } from "$components/ui/toast";
  import type { RecipeVisibility } from "$convex/lib/types";

  /**
   * Generated recipe payload.
   */
  type GeneratedRecipe = {
    title: string;
    description?: string;
    tasteProfiles: string[];
    ingredients: Array<{ name: string; volumeInMl: number; abv: number }>;
    steps: Array<{ stepNumber: number; description: string }>;
  };

  let baseAlcohol = $state("");
  let additionalNotes = $state("");
  let selectedProfiles = $state<string[]>([]);

  let isGenerating = $state(false);
  let generatedRecipe = $state<GeneratedRecipe | undefined>(undefined);
  let isSaving = $state(false);

  let selectedVisibility = $state<RecipeVisibility>("private");

  const tasteProfiles = [
    { id: "boozy", label: "Boozy", color: "bg-amber-500" },
    { id: "sweet", label: "Sweet", color: "bg-pink-500" },
    { id: "sour", label: "Sour", color: "bg-yellow-500" },
    { id: "bitter", label: "Bitter", color: "bg-orange-700" },
    { id: "umami", label: "Umami", color: "bg-purple-500" },
    { id: "astringent", label: "Astringent", color: "bg-gray-500" },
    { id: "hot", label: "Hot/Spicy", color: "bg-red-500" },
    { id: "cold", label: "Cold", color: "bg-blue-500" }
  ];

  const generateRecipe = useAction(api.agents.recipeGenerator.generateRecipe);
  const saveRecipe = useMutation(api.functions.recipes.saveAIGeneratedRecipe);

  /**
   * Toggle a taste profile selection.
   *
   * @param profileId - Profile ID to toggle
   */
  const toggleProfile = (profileId: string) => {
    if (selectedProfiles.includes(profileId)) {
      selectedProfiles = selectedProfiles.filter((profile) => profile !== profileId);
    } else {
      selectedProfiles = [...selectedProfiles, profileId];
    }
  };

  /**
   * Generate a new recipe based on current preferences.
   */
  const handleGenerate = async () => {
    isGenerating = true;
    generatedRecipe = undefined;

    try {
      const result = await generateRecipe.call({
        baseAlcohol: baseAlcohol.trim() || undefined,
        tastePreferences: selectedProfiles,
        additionalNotes: additionalNotes.trim() || undefined
      });

      generatedRecipe = result;
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate recipe. Please try again.");
    } finally {
      isGenerating = false;
    }
  };

  /**
   * Save the generated recipe to user's collection.
   */
  const handleSave = async () => {
    if (!generatedRecipe) {
      return;
    }

    isSaving = true;

    try {
      await saveRecipe.mutate({
        recipe: generatedRecipe,
        visibility: selectedVisibility
      });

      toast.success("Recipe saved to your collection!");
      generatedRecipe = undefined;
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save recipe. Please try again.");
    } finally {
      isSaving = false;
    }
  };
</script>

<div class="mx-auto max-w-4xl space-y-6">
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Sparkles class="h-5 w-5" />
        AI Recipe Generator
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-2">
        <Label for="baseAlcohol">Base Alcohol (optional)</Label>
        <Input id="baseAlcohol" placeholder="e.g., Vodka, Rum, Whiskey, Gin..." bind:value={baseAlcohol} />
      </div>

      <div class="space-y-2">
        <Label>Desired Taste Profiles</Label>
        <div class="flex flex-wrap gap-2">
          {#each tasteProfiles as profile (profile.id)}
            <button type="button" class="transition-all" onclick={() => toggleProfile(profile.id)}>
              <Badge
                class={selectedProfiles.includes(profile.id)
                  ? `${profile.color} text-white`
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
              >
                {#if selectedProfiles.includes(profile.id)}
                  <Check class="mr-1 h-3 w-3" />
                {/if}
                {profile.label}
              </Badge>
            </button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <Label for="notes">Additional Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any specific preferences, dietary restrictions, or inspiration..."
          bind:value={additionalNotes}
          rows={3}
        />
      </div>

      <Button class="w-full" onclick={handleGenerate} disabled={isGenerating}>
        {#if isGenerating}
          <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
          Generating...
        {:else}
          <Sparkles class="mr-2 h-4 w-4" />
          Generate Recipe
        {/if}
      </Button>
    </CardContent>
  </Card>

  {#if generatedRecipe}
    <Card>
      <CardHeader>
        <CardTitle>{generatedRecipe.title}</CardTitle>
        {#if generatedRecipe.description}
          <p class="text-muted-foreground">{generatedRecipe.description}</p>
        {/if}
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="flex flex-wrap gap-2">
          {#each generatedRecipe.tasteProfiles as profile (profile)}
            {@const profileData = tasteProfiles.find((p) => p.id === profile)}
            <Badge class={profileData?.color ?? "bg-gray-500"}>
              {profile}
            </Badge>
          {/each}
        </div>

        <div>
          <h3 class="mb-2 font-semibold">Ingredients</h3>
          <ul class="space-y-1">
            {#each generatedRecipe.ingredients as ingredient, index (index)}
              <li class="flex justify-between">
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

        <div>
          <h3 class="mb-2 font-semibold">Preparation</h3>
          <ol class="space-y-2">
            {#each generatedRecipe.steps as step (step.stepNumber)}
              <li class="flex gap-3">
                <span class="font-medium text-primary">{step.stepNumber}.</span>
                <span>{step.description}</span>
              </li>
            {/each}
          </ol>
        </div>

        <div class="space-y-2">
          <Label>Visibility when saved</Label>
          <select class="w-full rounded-md border px-3 py-2" bind:value={selectedVisibility}>
            <option value="private">Private (only you)</option>
            <option value="friends_only">Friends Only</option>
            <option value="public">Public</option>
          </select>
        </div>

        <div class="flex gap-3">
          <Button class="flex-1" onclick={handleSave} disabled={isSaving}>
            {#if isSaving}
              <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              <Save class="mr-2 h-4 w-4" />
              Save Recipe
            {/if}
          </Button>

          <Button variant="outline" onclick={handleGenerate} disabled={isGenerating}>
            <RefreshCw class="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
