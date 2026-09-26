/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
}

interface Window {
  __ENV__?: {
    VITE_MAPBOX_TOKEN?: string;
  };
}
