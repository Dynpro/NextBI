import { ProtocolMode } from '@azure/msal-browser';

export const msalConfig = {
  auth: {
    clientId: '1fb7982c-67f8-4c32-bafa-dbbc78e36063',
    authority: 'https://login.microsoftonline.com/02c5b066-c072-4b82-9474-43accc1385c6',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
    protocolMode: ProtocolMode.AAD
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInIframe: true,
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => {
        if (containsPii) return;
        switch (level) {
          case 0: console.error(message); break;
          case 1: console.warn(message); break;
          case 2: console.info(message); break;
          case 3: console.debug(message); break;
          default: console.log(message); break;
        }
      },
      logLevel: 3, // Verbose logging during development
    }
  }
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

// For silent token acquisition
export const silentRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
