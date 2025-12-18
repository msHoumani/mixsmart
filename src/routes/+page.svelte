<script lang="ts">
  import { Button } from "$components/ui/button";
  import { useAuth } from "@mmailaender/convex-better-auth-svelte/svelte";
  import { Sparkles, GlassWater, MapPin, Users } from "lucide-svelte";

  const auth = useAuth();
</script>

<div class="relative overflow-hidden">
  <div
    class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,229,160,0.35),transparent_55%),radial-gradient(circle_at_bottom,rgba(124,58,237,0.25),transparent_60%)]"
  ></div>

  <section class="container mx-auto px-4 py-20">
    <div class="grid items-center gap-12 lg:grid-cols-2">
      <div class="space-y-6">
        <div
          class="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-2 text-xs tracking-[0.2em] uppercase"
        >
          <Sparkles class="h-4 w-4" />
          Mix smarter, sip slower
        </div>
        <h1 class="text-4xl leading-tight font-bold md:text-5xl">
          MixSmart makes cocktail creativity measurable, social, and safe.
        </h1>
        <p class="text-lg text-muted-foreground">
          Craft AI-guided recipes, estimate BAC in real time, and source ingredients locally. Built for enthusiasts who
          want flavor, community, and responsibility in every glass.
        </p>
        <div class="flex flex-wrap gap-3">
          <Button href="/recipes">Explore Recipes</Button>
          {#if auth.isAuthenticated}
            <Button variant="secondary" href="/recipes/create">Create Your Own</Button>
          {:else}
            <Button variant="secondary" href="/auth/register">Join MixSmart</Button>
          {/if}
        </div>
      </div>

      <div class="rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur">
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-primary/10 p-3 text-primary">
              <GlassWater class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm tracking-[0.2em] text-muted-foreground uppercase">AI Mixology</p>
              <p class="text-lg font-semibold">Generate balanced cocktails with transparent ABV math.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-primary/10 p-3 text-primary">
              <MapPin class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm tracking-[0.2em] text-muted-foreground uppercase">Local Sourcing</p>
              <p class="text-lg font-semibold">Find bottles near you through curated Total Wine search.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-primary/10 p-3 text-primary">
              <Users class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm tracking-[0.2em] text-muted-foreground uppercase">Community</p>
              <p class="text-lg font-semibold">Follow friends, share recipes, and message in real time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>
