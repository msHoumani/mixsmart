<script lang="ts">
  import RecipeGenerator from "$components/ai/RecipeGenerator.svelte";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { Button } from "$components/ui/button";

  const auth = useAuth();
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="mb-6 text-3xl font-bold">AI Recipe Generation</h1>

  {#if auth.isAuthenticated}
    <RecipeGenerator />
  {:else}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Sign in to generate AI recipes.</p>
      <div class="mt-4 flex justify-center">
        <Button href="/auth/login">Sign In</Button>
      </div>
    </div>
  {/if}
</div>
