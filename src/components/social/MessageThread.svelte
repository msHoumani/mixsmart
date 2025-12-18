<script lang="ts">
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import type { Id } from "$convex/_generated/dataModel";

  /**
   * Message data model.
   */
  export type MessageEntry = {
    _id: Id<"messages">;
    senderId: Id<"users">;
    receiverId: Id<"users">;
    text: string;
    createdAt: number;
    isRead: boolean;
    attachmentUrls: string[];
  };

  /**
   * Props for the MessageThread component.
   */
  type Props = {
    messages: MessageEntry[];
    currentUserId: Id<"users">;
    isSending?: boolean;
    onSend: (text: string) => Promise<void> | void;
  };

  let { messages, currentUserId, isSending = false, onSend }: Props = $props();

  let draft = $state("");

  /**
   * Format timestamps for display.
   *
   * @param timestamp - Millisecond timestamp
   * @returns Localized date string
   */
  const formatTimestamp = (timestamp: number): string => new Date(timestamp).toLocaleTimeString();

  /**
   * Submit a new message.
   */
  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }
    await onSend(draft.trim());
    draft = "";
  };
</script>

<div class="flex h-full flex-col gap-4">
  <div class="flex-1 space-y-3 overflow-y-auto rounded-lg border p-4">
    {#if messages.length === 0}
      <p class="text-sm text-muted-foreground">No messages yet. Say hello!</p>
    {:else}
      {#each messages as message (message._id)}
        <div class={message.senderId === currentUserId ? "flex justify-end" : "flex justify-start"}>
          <div
            class={message.senderId === currentUserId
              ? "max-w-xs rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              : "max-w-xs rounded-lg bg-muted px-4 py-2 text-sm"}
          >
            <p>{message.text}</p>
            <p class="mt-1 text-[10px] opacity-70">{formatTimestamp(message.createdAt)}</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <div class="flex gap-2">
    <Input placeholder="Type a message..." bind:value={draft} />
    <Button onclick={handleSend} disabled={isSending || !draft.trim()}>
      {#if isSending}
        Sending...
      {:else}
        Send
      {/if}
    </Button>
  </div>
</div>
