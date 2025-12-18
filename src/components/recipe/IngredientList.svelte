<script lang="ts">
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";

  /**
   * Ingredient input data model.
   */
  export type IngredientInput = {
    name: string;
    volumeInMl: number;
    abv: number;
    estimatedPrice?: number;
  };

  /**
   * Props for the IngredientList component.
   */
  type Props = {
    ingredients?: IngredientInput[];
  };

  let { ingredients = $bindable<IngredientInput[]>([]) }: Props = $props();

  /**
   * Update an ingredient entry.
   *
   * @param index - Ingredient index
   * @param updates - Partial ingredient updates
   */
  const updateIngredient = (index: number, updates: Partial<IngredientInput>) => {
    ingredients = ingredients.map((ingredient, i) => (i === index ? { ...ingredient, ...updates } : ingredient));
  };

  /**
   * Add a new ingredient row.
   */
  const addIngredient = () => {
    ingredients = [
      ...ingredients,
      {
        name: "",
        volumeInMl: 0,
        abv: 0
      }
    ];
  };

  /**
   * Remove an ingredient row.
   *
   * @param index - Ingredient index to remove
   */
  const removeIngredient = (index: number) => {
    if (ingredients.length <= 2) {
      return;
    }
    ingredients = ingredients.filter((_, i) => i !== index);
  };
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">Ingredients</h3>
    <Button variant="outline" size="sm" type="button" onclick={addIngredient}>Add Ingredient</Button>
  </div>

  <div class="space-y-4">
    {#each ingredients as ingredient, index (index)}
      <div class="grid gap-4 rounded-lg border p-4 md:grid-cols-4">
        <div class="md:col-span-2">
          <Label for={`ingredient-name-${index}`}>Name</Label>
          <Input
            id={`ingredient-name-${index}`}
            placeholder="e.g., Vodka"
            value={ingredient.name}
            oninput={(event) => updateIngredient(index, { name: (event.currentTarget as HTMLInputElement).value })}
          />
        </div>

        <div>
          <Label for={`ingredient-volume-${index}`}>Volume (ml)</Label>
          <Input
            id={`ingredient-volume-${index}`}
            type="number"
            min="0"
            step="0.1"
            value={ingredient.volumeInMl}
            oninput={(event) =>
              updateIngredient(index, { volumeInMl: Number((event.currentTarget as HTMLInputElement).value) || 0 })}
          />
        </div>

        <div>
          <Label for={`ingredient-abv-${index}`}>ABV (0-1)</Label>
          <Input
            id={`ingredient-abv-${index}`}
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={ingredient.abv}
            oninput={(event) =>
              updateIngredient(index, { abv: Number((event.currentTarget as HTMLInputElement).value) || 0 })}
          />
        </div>

        <div class="flex justify-end md:col-span-4">
          <Button variant="ghost" size="sm" type="button" onclick={() => removeIngredient(index)}>Remove</Button>
        </div>
      </div>
    {/each}
  </div>
</div>
