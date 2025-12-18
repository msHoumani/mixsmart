<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";
  import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { authClient } from "$lib/auth-client";
  import ToastHost from "$components/ui/ToastHost.svelte";

  /** @type {import('./$types').LayoutProps} */
  let { children, data } = $props();

  createSvelteAuthClient({
    authClient,
    convexUrl: PUBLIC_CONVEX_URL,
    getServerState: () => data?.authState
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>MixSmart - Cocktail Recipe Platform</title>
  <meta name="description" content="AI-powered cocktail recipe creation and sharing" />
</svelte:head>

{@render children?.()}
<ToastHost />
