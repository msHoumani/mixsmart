declare global {
  namespace App {
    /**
     * Locals available during server-side rendering.
     */
    interface Locals {
      /** Authentication token for server-side operations */
      token: string | undefined;
    }
  }
}

export {};
