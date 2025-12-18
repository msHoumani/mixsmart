<script lang="ts">
  import { signUp } from "$lib/auth-client";
  import { useMutation } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { toast } from "$components/ui/toast";
  import { goto } from "$app/navigation";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";

  const auth = useAuth();
  const createProfile = useMutation(api.auth.createUserProfile);

  let username = $state("");
  let email = $state("");
  let password = $state("");
  let ageVerified = $state(false);
  let isSubmitting = $state(false);

  /**
   * Submit registration credentials.
   *
   * @param event - Submit event
   */
  const handleRegister = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      toast.error("All fields are required");
      return;
    }

    if (!ageVerified) {
      toast.error("You must confirm you are 21+ and verified");
      return;
    }

    isSubmitting = true;

    try {
      const result = await signUp.email({
        email: email.trim(),
        password,
        username: username.trim()
      });

      if (result && typeof result === "object" && "error" in result && result.error) {
        toast.error(result.error.message ?? "Registration failed");
        return;
      }

      await createProfile.mutate({ username: username.trim(), ageVerified });

      toast.success("Account created successfully!");
      await goto("/recipes");
    } catch (error) {
      console.error("Registration failed", error);
      toast.error("Registration failed");
    } finally {
      isSubmitting = false;
    }
  };
</script>

<div class="container mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
  <div>
    <h1 class="text-3xl font-bold">Create Account</h1>
    <p class="text-sm text-muted-foreground">Join MixSmart and share your cocktail creations.</p>
  </div>

  {#if auth.isAuthenticated}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">You are already signed in.</p>
      <div class="mt-4">
        <Button href="/recipes">Go to Recipes</Button>
      </div>
    </div>
  {:else}
    <form class="space-y-4 rounded-lg border p-6" onsubmit={handleRegister}>
      <div class="space-y-2">
        <Label for="username">Username</Label>
        <Input id="username" bind:value={username} />
      </div>

      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" bind:value={email} />
      </div>

      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input id="password" type="password" bind:value={password} />
      </div>

      <label class="flex items-start gap-2 text-sm">
        <input type="checkbox" bind:checked={ageVerified} class="mt-1" />
        <span> I confirm I am 21+ years old and have verified my age with a valid government-issued ID. </span>
      </label>

      <Button type="submit" class="w-full" disabled={isSubmitting}>
        {#if isSubmitting}
          Creating account...
        {:else}
          Create Account
        {/if}
      </Button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      Already have an account? <a href="/auth/login" class="font-medium text-primary underline">Sign in</a>
    </p>
  {/if}
</div>
