declare module "virtual:local-art" {
  /** Paths inside apps/web/local-art/, served at the site root in dev only. Empty in builds. */
  export const localArtFiles: readonly string[];
}
