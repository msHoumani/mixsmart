<script lang="ts">
  import { useMutation, useQuery } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { Button } from "$components/ui/button";
  import MessageThread, { type MessageEntry } from "$components/social/MessageThread.svelte";
  import { toast } from "$components/ui/toast";
  import type { Id } from "$convex/_generated/dataModel";

  const auth = useAuth();

  const profileQuery = useQuery(api.auth.getUserProfile, () => (auth.isAuthenticated ? {} : "skip"));
  const conversationsQuery = useQuery(api.functions.messages.getConversationList, () =>
    auth.isAuthenticated ? {} : "skip"
  );

  let selectedPartnerId = $state<Id<"users"> | undefined>(undefined);

  const conversationQuery = useQuery(api.functions.messages.getConversation, () =>
    selectedPartnerId ? { otherUserId: selectedPartnerId } : "skip"
  );

  const sendMessage = useMutation(api.functions.messages.sendMessage);
  const markAsRead = useMutation(api.functions.messages.markAsRead);

  /**
   * Select a conversation partner and mark messages as read.
   *
   * @param partnerId - Partner user ID
   */
  const handleSelectPartner = async (partnerId: Id<"users">) => {
    selectedPartnerId = partnerId;
    try {
      await markAsRead.mutate({ senderId: partnerId });
    } catch (error) {
      console.error("Failed to mark messages as read", error);
    }
  };

  /**
   * Send a message to the selected partner.
   *
   * @param text - Message body
   */
  const handleSend = async (text: string) => {
    if (!selectedPartnerId) {
      return;
    }

    try {
      await sendMessage.mutate({ receiverId: selectedPartnerId, text });
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error("Failed to send message");
    }
  };
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Messages</h1>
    <Button variant="ghost" href="/social/friends">Friends</Button>
  </div>

  {#if !auth.isAuthenticated}
    <div class="rounded-lg border p-6 text-center">
      <p class="text-muted-foreground">Sign in to view messages.</p>
      <div class="mt-4">
        <Button href="/auth/login">Sign In</Button>
      </div>
    </div>
  {:else}
    <div class="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <div class="space-y-3 rounded-lg border p-4">
        <h2 class="text-lg font-semibold">Conversations</h2>
        {#if conversationsQuery.data && conversationsQuery.data.length > 0}
          <ul class="space-y-2">
            {#each conversationsQuery.data as convo (convo.partnerId)}
              <li>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition hover:bg-muted"
                  onclick={() => handleSelectPartner(convo.partnerId as Id<"users">)}
                >
                  <div>
                    <p class="font-medium">{convo.partner?.username ?? "Unknown"}</p>
                    <p class="text-xs text-muted-foreground">{convo.lastMessage.text}</p>
                  </div>
                  {#if convo.unreadCount > 0}
                    <span class="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {convo.unreadCount}
                    </span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-muted-foreground">No conversations yet.</p>
        {/if}
      </div>

      <div class="rounded-lg border p-4">
        {#if selectedPartnerId && conversationQuery.data && profileQuery.data?._id}
          <MessageThread
            messages={conversationQuery.data as MessageEntry[]}
            currentUserId={profileQuery.data._id as Id<"users">}
            isSending={sendMessage.isLoading}
            onSend={handleSend}
          />
        {:else}
          <div class="flex h-full items-center justify-center text-muted-foreground">
            Select a conversation to start messaging.
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
