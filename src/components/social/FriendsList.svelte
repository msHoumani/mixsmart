<script lang="ts">
  import { Button } from "$components/ui/button";
  import type { Doc } from "$convex/_generated/dataModel";

  /**
   * Props for the FriendsList component.
   */
  type Props = {
    friends: Doc<"users">[];
    onRemove?: (friendId: string) => void;
  };

  let { friends, onRemove }: Props = $props();
</script>

<div class="space-y-4">
  {#if friends.length === 0}
    <p class="text-sm text-muted-foreground">No friends yet. Send a request to get started.</p>
  {:else}
    <ul class="space-y-3">
      {#each friends as friend (friend._id)}
        <li class="flex items-center justify-between rounded-lg border p-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 overflow-hidden rounded-full bg-muted">
              {#if friend.profilePicUrl}
                <img src={friend.profilePicUrl} alt={friend.username} class="h-full w-full object-cover" />
              {/if}
            </div>
            <div>
              <p class="font-medium">{friend.username}</p>
            </div>
          </div>
          {#if onRemove}
            <Button variant="ghost" size="sm" type="button" onclick={() => onRemove(friend._id)}>Remove</Button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
