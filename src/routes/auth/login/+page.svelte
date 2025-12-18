<script lang="ts">
  import { signIn } from "$lib/auth-client";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { toast } from "$components/ui/toast";
  import { goto } from "$app/navigation";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";

  const auth = useAuth();

  let email = $state("");
  let password = $state("");
  let isSubmitting = $state(false);

  /**
   * Submit login credentials.
   *
   * @param event - Submit event
   */
  const handleLogin = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }

    isSubmitting = true;

    try {
      const result = await signIn.email({
        email: email.trim(),
        password
      });

      if (result && typeof result === "object" && "error" in result && result.error) {
        toast.error(result.error.message ?? "Login failed");
        return;
      }

      toast.success("Welcome back!");
      await goto("/recipes");
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Login failed");
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div class="container mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
  <div>
    <h1 class="text-3xl font-bold">Sign In</h1>
    <p class="text-sm text-muted-foreground">Access your MixSmart account.</p>
  </div>

  {#if auth.isAuthenticated}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">You are already signed in.</p>
      <div class="mt-4">
        <Button href="/recipes">Go to Recipes</Button>
      </div>
    </div>
  {:else}
    <form class="space-y-4 rounded-lg border p-6" onsubmit={handleLogin}>
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" bind:value={email} />
      </div>

      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input id="password" type="password" bind:value={password} />
      </div>

      <Button type="submit" class="w-full" disabled={isSubmitting}>
        {#if isSubmitting}
          Signing in...
        {:else}
          Sign In
        {/if}
      </Button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      New to MixSmart? <a href="/auth/register" class="font-medium text-primary underline">Create an account</a>
    </p>
  {/if}
</div>
