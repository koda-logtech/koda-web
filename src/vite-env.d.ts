/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
}

interface Window {
  __ENV__?: {
    VITE_API_URL?: string;
    VITE_APP_NAME?: string;
    VITE_MAPBOX_TOKEN?: string;
    VITE_STORAGE_PREFIX?: string;
    VITE_ACCESS_TOKEN_KEY?: string;
    VITE_REFRESH_TOKEN_KEY?: string;
  };
}
