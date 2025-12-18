<script lang="ts">
  import { useQuery } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { Button } from "$components/ui/button";

  const auth = useAuth();
  const userProfileQuery = useQuery(api.auth.getUserProfile, () => (auth.isAuthenticated ? {} : "skip"));
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Your Profile</h1>
    <Button variant="secondary" href="/profile/settings">Edit Settings</Button>
  </div>

  {#if !auth.isAuthenticated}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Sign in to view your profile.</p>
      <div class="mt-4">
        <Button href="/auth/login">Sign In</Button>
      </div>
    </div>
  {:else if userProfileQuery.isLoading}
    <div class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  {:else if userProfileQuery.data}
    <div class="grid gap-6 md:grid-cols-2">
      <div class="rounded-lg border p-6">
        <h2 class="text-lg font-semibold">Account</h2>
        <div class="mt-4 space-y-2 text-sm">
          <p><span class="font-medium">Username:</span> {userProfileQuery.data.username}</p>
          <p><span class="font-medium">Age Verified:</span> {userProfileQuery.data.ageVerified ? "Yes" : "No"}</p>
          <p><span class="font-medium">2FA Enabled:</span> {userProfileQuery.data.is2FAEnabled ? "Yes" : "No"}</p>
        </div>
      </div>

      <div class="rounded-lg border p-6">
        <h2 class="text-lg font-semibold">Preferences</h2>
        <div class="mt-4 space-y-2 text-sm">
          <p><span class="font-medium">ZIP Code:</span> {userProfileQuery.data.zipCode ?? "Not set"}</p>
          <p><span class="font-medium">Biological Sex:</span> {userProfileQuery.data.biologicalSex ?? "Not set"}</p>
          <p><span class="font-medium">Weight (kg):</span> {userProfileQuery.data.weightInKg ?? "Not set"}</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Profile not found. Complete registration to get started.</p>
    </div>
  {/if}
</div>
