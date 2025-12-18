<script lang="ts">
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { Textarea } from "$components/ui/textarea";
  import IngredientList, { type IngredientInput } from "./IngredientList.svelte";
  import StepsList, { type StepInput } from "./StepsList.svelte";
  import { toast } from "$components/ui/toast";
  import { tasteProfileValues, type RecipeVisibility } from "$convex/lib/types";

  /**
   * Recipe form data payload.
   */
  export type RecipeFormData = {
    title: string;
    description?: string;
    tasteProfiles: string[];
    visibility: RecipeVisibility;
    ingredients: IngredientInput[];
    steps: StepInput[];
  };

  /**
   * Props for the RecipeForm component.
   */
  type Props = {
    initialData?: Partial<RecipeFormData>;
    onSubmit: (data: RecipeFormData) => Promise<void> | void;
    submitLabel?: string;
    isSubmitting?: boolean;
  };

  let { initialData, onSubmit, submitLabel = "Save Recipe", isSubmitting = false }: Props = $props();

  const defaultIngredients: IngredientInput[] =
    initialData?.ingredients?.length && initialData.ingredients.length >= 2
      ? initialData.ingredients
      : [
          { name: "", volumeInMl: 0, abv: 0 },
          { name: "", volumeInMl: 0, abv: 0 }
        ];

  const defaultSteps: StepInput[] =
    initialData?.steps?.length && initialData.steps.length > 0
      ? initialData.steps
      : [{ stepNumber: 1, description: "" }];

  let title = $state(initialData?.title ?? "");
  let description = $state(initialData?.description ?? "");
  let tasteProfiles = $state<string[]>(initialData?.tasteProfiles ?? []);
  let visibility = $state<RecipeVisibility>(initialData?.visibility ?? "private");
  let ingredients = $state<IngredientInput[]>(defaultIngredients);
  let steps = $state<StepInput[]>(defaultSteps);

  /**
   * Toggle a taste profile selection.
   *
   * @param profileId - Taste profile id
   */
  const toggleProfile = (profileId: string) => {
    if (tasteProfiles.includes(profileId)) {
      tasteProfiles = tasteProfiles.filter((profile) => profile !== profileId);
    } else {
      tasteProfiles = [...tasteProfiles, profileId];
    }
  };

  /**
   * Validate the form state before submit.
   *
   * @returns True when the form is valid
   */
  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error("Recipe title is required");
      return false;
    }

    if (ingredients.length < 2) {
      toast.error("Recipes must include at least 2 ingredients");
      return false;
    }

    const hasInvalidIngredient = ingredients.some(
      (ingredient) => !ingredient.name.trim() || ingredient.volumeInMl <= 0 || ingredient.abv < 0 || ingredient.abv > 1
    );

    if (hasInvalidIngredient) {
      toast.error("Please complete all ingredient fields with valid values");
      return false;
    }

    if (steps.length < 1) {
      toast.error("Please add at least one preparation step");
      return false;
    }

    const hasInvalidSteps = steps.some((step) => !step.description.trim());
    if (hasInvalidSteps) {
      toast.error("Please complete all preparation steps");
      return false;
    }

    return true;
  };

  /**
   * Handle form submission.
   *
   * @param event - Submit event
   */
  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        tasteProfiles,
        visibility,
        ingredients: ingredients.map((ingredient) => ({
          ...ingredient,
          name: ingredient.name.trim()
        })),
        steps: steps.map((step, index) => ({
          ...step,
          stepNumber: index + 1,
          description: step.description.trim()
        }))
      });
    } catch (error) {
      console.error("Recipe submission failed", error);
      toast.error("Failed to submit recipe");
    }
  };
</script>

<form class="space-y-6" onsubmit={handleSubmit}>
  <div class="space-y-2">
    <Label for="recipe-title">Recipe Title</Label>
    <Input id="recipe-title" placeholder="Name your cocktail" bind:value={title} />
  </div>

  <div class="space-y-2">
    <Label for="recipe-description">Description</Label>
    <Textarea
      id="recipe-description"
      placeholder="Describe the flavor, inspiration, or serving notes"
      bind:value={description}
    />
  </div>

  <div class="space-y-2">
    <Label>Taste Profiles</Label>
    <div class="flex flex-wrap gap-2">
      {#each tasteProfileValues as profile (profile)}
        <button
          type="button"
          class="rounded-full border px-3 py-1 text-sm transition-all"
          class:scale-105={tasteProfiles.includes(profile)}
          class:bg-primary={tasteProfiles.includes(profile)}
          class:text-primary-foreground={tasteProfiles.includes(profile)}
          onclick={() => toggleProfile(profile)}
        >
          {profile}
        </button>
      {/each}
    </div>
  </div>

  <div class="space-y-2">
    <Label for="recipe-visibility">Visibility</Label>
    <select id="recipe-visibility" class="w-full rounded-md border px-3 py-2" bind:value={visibility}>
      <option value="private">Private (only you)</option>
      <option value="friends_only">Friends Only</option>
      <option value="public">Public</option>
    </select>
  </div>

  <IngredientList bind:ingredients />
  <StepsList bind:steps />

  <div class="flex justify-end">
    <Button type="submit" disabled={isSubmitting}>
      {#if isSubmitting}
        Saving...
      {:else}
        {submitLabel}
      {/if}
    </Button>
  </div>
</form>
