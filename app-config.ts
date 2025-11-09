export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'LEVEL 11',
  pageTitle: 'LEVEL 11 // Career OS',
  pageDescription:
    'Your AI senior engineer companion for career planning, regular check-ins, and leveling up your professional journey.',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg',
  accent: '#00f5ff',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#00f5ff',
  startButtonText: '[ START SESSION ]',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,
};
