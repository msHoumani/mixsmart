<script lang="ts">
  import { useMutation } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { toast } from "$components/ui/toast";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";

  const auth = useAuth();
  const enableTwoFactor = useMutation(api.auth.enable2FA);

  let email = $state("");
  let phoneNumber = $state("");

  /**
   * Submit the 2FA enablement request.
   *
   * @param event - Submit event
   */
  const handleEnable = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required to enable 2FA");
      return;
    }

    try {
      await enableTwoFactor.mutate({
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined
      });

      toast.success("2FA enabled successfully");
    } catch (error) {
      console.error("Failed to enable 2FA", error);
      toast.error("Failed to enable 2FA");
    }
  };
</script>

<div class="container mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
  <div>
    <h1 class="text-3xl font-bold">Enable 2FA</h1>
    <p class="text-sm text-muted-foreground">Set up two-factor authentication to unlock notifications.</p>
  </div>

  {#if !auth.isAuthenticated}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Sign in to enable 2FA.</p>
      <div class="mt-4">
        <Button href="/auth/login">Sign In</Button>
      </div>
    </div>
  {:else}
    <form class="space-y-4 rounded-lg border p-6" onsubmit={handleEnable}>
      <div class="space-y-2">
        <Label for="twofa-email">Email</Label>
        <Input id="twofa-email" type="email" bind:value={email} />
      </div>

      <div class="space-y-2">
        <Label for="twofa-phone">Phone Number (optional)</Label>
        <Input id="twofa-phone" bind:value={phoneNumber} />
      </div>

      <Button type="submit" class="w-full" disabled={enableTwoFactor.isLoading}>
        {#if enableTwoFactor.isLoading}
          Enabling...
        {:else}
          Enable 2FA
        {/if}
      </Button>
    </form>
  {/if}
</div>
