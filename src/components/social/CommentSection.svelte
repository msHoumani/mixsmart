<script lang="ts">
  import { useMutation, useQuery } from "$lib/convex";
  import { api } from "$convex/_generated/api";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { Button } from "$components/ui/button";
  import { Textarea } from "$components/ui/textarea";
  import { toast } from "$components/ui/toast";
  import type { Id } from "$convex/_generated/dataModel";

  /**
   * Props for the CommentSection component.
   */
  type Props = {
    recipeId: Id<"recipes">;
  };

  let { recipeId }: Props = $props();

  const auth = useAuth();
  const addComment = useMutation(api.functions.comments.addComment);
  const commentsQuery = useQuery(api.functions.comments.getComments, () => (recipeId ? { recipeId } : "skip"));

  let commentText = $state("");

  /**
   * Submit a new comment.
   */
  const handleSubmit = async () => {
    if (!commentText.trim()) {
      toast.error("Please enter a comment before submitting");
      return;
    }

    try {
      await addComment.mutate({ recipeId, text: commentText });
      commentText = "";
    } catch (error) {
      console.error("Failed to add comment", error);
      toast.error("Failed to add comment");
    }
  };

  /**
   * Format a timestamp for display.
   *
   * @param timestamp - Millisecond timestamp
   * @returns Localized date string
   */
  const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleString();
</script>

<div class="space-y-4">
  <h3 class="text-lg font-semibold">Comments</h3>

  {#if auth.isAuthenticated}
    <div class="space-y-2">
      <Textarea placeholder="Share your thoughts..." bind:value={commentText} />
      <div class="flex justify-end">
        <Button onclick={handleSubmit} disabled={addComment.isLoading}>Post Comment</Button>
      </div>
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">Sign in to leave a comment.</p>
  {/if}

  {#if commentsQuery.isLoading}
    <p class="text-sm text-muted-foreground">Loading comments...</p>
  {:else if commentsQuery.data && commentsQuery.data.length > 0}
    <div class="space-y-3">
      {#each commentsQuery.data as entry (entry.comment._id)}
        <div class="rounded-lg border p-3">
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold">{entry.author?.username ?? "Unknown"}</span>
            <span class="text-xs text-muted-foreground">{formatDate(entry.comment.createdAt)}</span>
          </div>
          <p class="mt-2 text-sm">{entry.comment.text}</p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">No comments yet.</p>
  {/if}
</div>
