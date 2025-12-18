import { getFunctionName, type FunctionArgs, type FunctionReference, type FunctionReturnType } from "convex/server";
import { setupConvex, useConvexClient, useQuery } from "convex-svelte";
import type { ConvexClientOptions } from "convex/browser";
import { PUBLIC_CONVEX_URL } from "$env/static/public";

/**
 * Initialize the Convex client with the public deployment URL.
 *
 * @param url - Optional Convex deployment URL override
 * @param options - Optional Convex client options
 */
export const setupConvexClient = (url: string = PUBLIC_CONVEX_URL, options?: ConvexClientOptions): void => {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) {
    throw new Error("Convex URL is required");
  }

  setupConvex(normalizedUrl, options);
};

/**
 * Shape returned by the useMutation hook.
 */
export type MutationHook<Mutation extends FunctionReference<"mutation">> = {
  mutate: (args: FunctionArgs<Mutation>) => Promise<FunctionReturnType<Mutation>>;
  readonly isLoading: boolean;
  readonly error: Error | undefined;
};

/**
 * Shape returned by the useAction hook.
 */
export type ActionHook<Action extends FunctionReference<"action">> = {
  call: (args: FunctionArgs<Action>) => Promise<FunctionReturnType<Action>>;
  readonly isLoading: boolean;
  readonly error: Error | undefined;
};

/**
 * Run a Convex mutation with local loading/error state.
 *
 * @param mutation - Convex mutation reference
 * @returns Mutation hook object
 */
export const useMutation = <Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
): MutationHook<Mutation> => {
  const client = useConvexClient();
  const state = $state<{ isLoading: boolean; error?: Error }>({
    isLoading: false,
    error: undefined
  });

  const mutate = async (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
    state.isLoading = true;
    state.error = undefined;

    try {
      return (await client.mutation(getFunctionName(mutation), args)) as FunctionReturnType<Mutation>;
    } catch (error) {
      state.error = error instanceof Error ? error : new Error("Mutation failed");
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  return {
    mutate,
    get isLoading() {
      return state.isLoading;
    },
    get error() {
      return state.error;
    }
  };
};

/**
 * Run a Convex action with local loading/error state.
 *
 * @param action - Convex action reference
 * @returns Action hook object
 */
export const useAction = <Action extends FunctionReference<"action">>(action: Action): ActionHook<Action> => {
  const client = useConvexClient();
  const state = $state<{ isLoading: boolean; error?: Error }>({
    isLoading: false,
    error: undefined
  });

  const call = async (args: FunctionArgs<Action>): Promise<FunctionReturnType<Action>> => {
    state.isLoading = true;
    state.error = undefined;

    try {
      return (await client.action(getFunctionName(action), args)) as FunctionReturnType<Action>;
    } catch (error) {
      state.error = error instanceof Error ? error : new Error("Action failed");
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  return {
    call,
    get isLoading() {
      return state.isLoading;
    },
    get error() {
      return state.error;
    }
  };
};

/**
 * Re-export the Convex query hook.
 */
export { useQuery };

/**
 * Re-export the Convex client accessor hook.
 */
export { useConvexClient };
