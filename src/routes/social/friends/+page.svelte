<script lang="ts">
  import { useMutation, useQuery } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import FriendsList from "$components/social/FriendsList.svelte";
  import { toast } from "$components/ui/toast";

  const auth = useAuth();

  const friendsQuery = useQuery(api.functions.social.getFriends, () => (auth.isAuthenticated ? {} : "skip"));
  const requestsQuery = useQuery(api.functions.social.getPendingFriendRequests, () =>
    auth.isAuthenticated ? {} : "skip"
  );

  const lookupUser = useQuery(api.functions.users.getUserByUsername, () =>
    usernameInput.trim() ? { username: usernameInput.trim() } : "skip"
  );

  const sendFriendRequest = useMutation(api.functions.social.sendFriendRequest);
  const acceptRequest = useMutation(api.functions.social.acceptFriendRequest);
  const declineRequest = useMutation(api.functions.social.declineFriendRequest);
  const removeFriend = useMutation(api.functions.social.removeFriend);

  let usernameInput = $state("");

  /**
   * Send a friend request to the looked-up user.
   */
  const handleSendRequest = async () => {
    if (!lookupUser.data) {
      toast.error("User not found");
      return;
    }

    try {
      await sendFriendRequest.mutate({ receiverId: lookupUser.data._id });
      toast.success("Friend request sent");
      usernameInput = "";
    } catch (error) {
      console.error("Failed to send friend request", error);
      toast.error("Failed to send friend request");
    }
  };

  /**
   * Accept a friend request.
   *
   * @param requestId - Friend request ID
   */
  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest.mutate({ requestId });
    } catch (error) {
      console.error("Failed to accept request", error);
      toast.error("Failed to accept request");
    }
  };

  /**
   * Decline a friend request.
   *
   * @param requestId - Friend request ID
   */
  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest.mutate({ requestId });
    } catch (error) {
      console.error("Failed to decline request", error);
      toast.error("Failed to decline request");
    }
  };

  /**
   * Remove a friend.
   *
   * @param friendId - Friend user ID
   */
  const handleRemove = async (friendId: string) => {
    try {
      await removeFriend.mutate({ friendId });
      toast.success("Friend removed");
    } catch (error) {
      console.error("Failed to remove friend", error);
      toast.error("Failed to remove friend");
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Friends</h1>
    <Button variant="ghost" href="/social/messages">Messages</Button>
  </div>

  {#if !auth.isAuthenticated}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Sign in to manage friends.</p>
      <div class="mt-4">
        <Button href="/auth/login">Sign In</Button>
      </div>
    </div>
  {:else}
    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div class="space-y-6">
        <div class="rounded-lg border p-6">
          <h2 class="mb-4 text-lg font-semibold">Your Friends</h2>
          <FriendsList friends={friendsQuery.data ?? []} onRemove={handleRemove} />
        </div>

        <div class="rounded-lg border p-6">
          <h2 class="mb-4 text-lg font-semibold">Pending Requests</h2>
          {#if requestsQuery.data && requestsQuery.data.length > 0}
            <ul class="space-y-3">
              {#each requestsQuery.data as request (request._id)}
                <li class="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p class="font-medium">{request.sender?.username ?? "Unknown"}</p>
                  </div>
                  <div class="flex gap-2">
                    <Button size="sm" onclick={() => handleAccept(request._id)}>Accept</Button>
                    <Button variant="outline" size="sm" onclick={() => handleDecline(request._id)}>Decline</Button>
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-sm text-muted-foreground">No pending requests.</p>
          {/if}
        </div>
      </div>

      <div class="rounded-lg border p-6">
        <h2 class="mb-4 text-lg font-semibold">Add a Friend</h2>
        <div class="space-y-2">
          <Label for="friend-username">Username</Label>
          <Input id="friend-username" placeholder="Search by username" bind:value={usernameInput} />
        </div>
        <Button class="mt-4 w-full" onclick={handleSendRequest} disabled={!usernameInput.trim()}>Send Request</Button>
        {#if lookupUser.data}
          <p class="mt-2 text-xs text-muted-foreground">Found: {lookupUser.data.username}</p>
        {/if}
      </div>
    </div>
  {/if}
</div>
