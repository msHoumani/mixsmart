<script lang="ts">
  import { useMutation, useQuery } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { toast } from "$components/ui/toast";

  const auth = useAuth();
  const profileQuery = useQuery(api.auth.getUserProfile, () => (auth.isAuthenticated ? {} : "skip"));
  const updateProfile = useMutation(api.auth.updateUserProfile);
  const enableTwoFactor = useMutation(api.auth.enable2FA);

  let zipCode = $state("");
  let biologicalSex = $state<"male" | "female" | "">("");
  let weightInKg = $state("");
  let email = $state("");
  let phoneNumber = $state("");
  let profilePicUrl = $state("");

  let twoFactorEmail = $state("");
  let twoFactorPhone = $state("");

  /**
   * Sync form fields when profile data loads.
   */
  $effect(() => {
    if (profileQuery.data) {
      zipCode = profileQuery.data.zipCode ?? "";
      biologicalSex = profileQuery.data.biologicalSex ?? "";
      weightInKg = profileQuery.data.weightInKg ? String(profileQuery.data.weightInKg) : "";
      email = profileQuery.data.email ?? "";
      phoneNumber = profileQuery.data.phoneNumber ?? "";
      profilePicUrl = profileQuery.data.profilePicUrl ?? "";
      twoFactorEmail = profileQuery.data.email ?? "";
      twoFactorPhone = profileQuery.data.phoneNumber ?? "";
    }
  });

  /**
   * Submit profile updates.
   *
   * @param event - Submit event
   */
  const handleSave = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      await updateProfile.mutate({
        zipCode: zipCode || undefined,
        biologicalSex: biologicalSex || undefined,
        weightInKg: weightInKg ? Number(weightInKg) : undefined,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        profilePicUrl: profilePicUrl || undefined
      });

      toast.success("Profile updated");
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile");
    }
  };

  /**
   * Enable 2FA for the user.
   *
   * @param event - Submit event
   */
  const handleEnable2FA = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      await enableTwoFactor.mutate({
        email: twoFactorEmail,
        phoneNumber: twoFactorPhone || undefined
      });

      toast.success("2FA enabled successfully");
    } catch (error) {
      console.error("Failed to enable 2FA", error);
      toast.error("Failed to enable 2FA");
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Account Settings</h1>
    <Button variant="ghost" href="/profile">Back to Profile</Button>
  </div>

  {#if !auth.isAuthenticated}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Sign in to manage settings.</p>
      <div class="mt-4">
        <Button href="/auth/login">Sign In</Button>
      </div>
    </div>
  {:else}
    <div class="grid gap-6 lg:grid-cols-2">
      <form class="space-y-4 rounded-lg border p-6" onsubmit={handleSave}>
        <h2 class="text-lg font-semibold">Profile Details</h2>

        <div class="space-y-2">
          <Label for="zip">ZIP Code</Label>
          <Input id="zip" placeholder="e.g., 90210" maxlength={5} bind:value={zipCode} />
        </div>

        <div class="space-y-2">
          <Label for="sex">Biological Sex</Label>
          <select id="sex" class="w-full rounded-md border px-3 py-2" bind:value={biologicalSex}>
            <option value="">Not set</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div class="space-y-2">
          <Label for="weight">Weight (kg)</Label>
          <Input id="weight" type="number" min="1" step="0.1" bind:value={weightInKg} />
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} />
        </div>

        <div class="space-y-2">
          <Label for="phone">Phone Number</Label>
          <Input id="phone" bind:value={phoneNumber} />
        </div>

        <div class="space-y-2">
          <Label for="profilePic">Profile Picture URL</Label>
          <Input id="profilePic" bind:value={profilePicUrl} />
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={updateProfile.isLoading}>
            {#if updateProfile.isLoading}
              Saving...
            {:else}
              Save Changes
            {/if}
          </Button>
        </div>
      </form>

      <form class="space-y-4 rounded-lg border p-6" onsubmit={handleEnable2FA}>
        <h2 class="text-lg font-semibold">Two-Factor Authentication</h2>
        <p class="text-sm text-muted-foreground">Enable 2FA to receive notifications and keep your account secure.</p>

        <div class="space-y-2">
          <Label for="twofa-email">Email</Label>
          <Input id="twofa-email" type="email" bind:value={twoFactorEmail} />
        </div>

        <div class="space-y-2">
          <Label for="twofa-phone">Phone Number (optional)</Label>
          <Input id="twofa-phone" bind:value={twoFactorPhone} />
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={enableTwoFactor.isLoading}>
            {#if enableTwoFactor.isLoading}
              Enabling...
            {:else}
              Enable 2FA
            {/if}
          </Button>
        </div>
      </form>
    </div>
  {/if}
</div>
