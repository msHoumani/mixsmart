<script lang="ts">
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { Textarea } from "$components/ui/textarea";

  /**
   * Step input data model.
   */
  export type StepInput = {
    stepNumber: number;
    description: string;
  };

  /**
   * Props for the StepsList component.
   */
  type Props = {
    steps?: StepInput[];
  };

  let { steps = $bindable<StepInput[]>([]) }: Props = $props();

  /**
   * Update a step entry.
   *
   * @param index - Step index
   * @param updates - Partial step updates
   */
  const updateStep = (index: number, updates: Partial<StepInput>) => {
    steps = steps.map((step, i) => (i === index ? { ...step, ...updates } : step));
  };

  /**
   * Add a new step row.
   */
  const addStep = () => {
    steps = [
      ...steps,
      {
        stepNumber: steps.length + 1,
        description: ""
      }
    ];
  };

  /**
   * Remove a step row and renumber remaining steps.
   *
   * @param index - Step index to remove
   */
  const removeStep = (index: number) => {
    if (steps.length <= 1) {
      return;
    }
    const remaining = steps.filter((_, i) => i !== index);
    steps = remaining.map((step, i) => ({ ...step, stepNumber: i + 1 }));
  };
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold">Preparation Steps</h3>
    <Button variant="outline" size="sm" type="button" onclick={addStep}>Add Step</Button>
  </div>

  <div class="space-y-4">
    {#each steps as step, index (index)}
      <div class="space-y-3 rounded-lg border p-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Label for={`step-number-${index}`}>Step</Label>
            <Input
              id={`step-number-${index}`}
              type="number"
              min="1"
              value={step.stepNumber}
              oninput={(event) =>
                updateStep(index, { stepNumber: Number((event.currentTarget as HTMLInputElement).value) || index + 1 })}
              class="w-20"
            />
          </div>
          <Button variant="ghost" size="sm" type="button" onclick={() => removeStep(index)}>Remove</Button>
        </div>

        <div>
          <Label for={`step-description-${index}`}>Instruction</Label>
          <Textarea
            id={`step-description-${index}`}
            placeholder="Describe the step..."
            value={step.description}
            oninput={(event) => updateStep(index, { description: (event.currentTarget as HTMLTextAreaElement).value })}
          />
        </div>
      </div>
    {/each}
  </div>
</div>
