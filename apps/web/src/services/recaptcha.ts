import api from './api';

type PublicSecurityConfig = {
  recaptcha?: {
    enabled?: boolean;
    siteKey?: string;
    minScore?: number;
  };
};

type GrecaptchaApi = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi;
  }
}

let securityConfigPromise: Promise<PublicSecurityConfig> | null = null;
let loadedSiteKey: string | null = null;

async function getSecurityConfig(): Promise<PublicSecurityConfig> {
  if (!securityConfigPromise) {
    securityConfigPromise = api
      .get('/config/public')
      .then((response: any) => response.data as PublicSecurityConfig)
      .catch((error: any) => {
        securityConfigPromise = null;
        throw error;
      });
  }
  return securityConfigPromise as Promise<PublicSecurityConfig>;
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (window.grecaptcha && loadedSiteKey === siteKey) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-prodisa-recaptcha="v3"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google reCAPTCHA.')), { once: true });
      if (window.grecaptcha) {
        loadedSiteKey = siteKey;
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.prodisaRecaptcha = 'v3';
    script.onload = () => {
      loadedSiteKey = siteKey;
      resolve();
    };
    script.onerror = () => reject(new Error('No se pudo cargar Google reCAPTCHA.'));
    document.head.appendChild(script);
  });
}

export async function getRecaptchaToken(action: 'login' | 'contact_quote'): Promise<string> {
  const config = await getSecurityConfig();
  const recaptcha = config.recaptcha;

  if (!recaptcha?.enabled) {
    return '';
  }

  const siteKey = recaptcha.siteKey?.trim();
  if (!siteKey) {
    throw new Error('reCAPTCHA v3 está habilitado pero no tiene Site Key configurada.');
  }

  await loadRecaptchaScript(siteKey);

  if (!window.grecaptcha) {
    throw new Error('Google reCAPTCHA no está disponible.');
  }

  return new Promise<string>((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window.grecaptcha!
        .execute(siteKey, { action })
        .then(resolve)
        .catch(() => reject(new Error('No fue posible completar la verificación reCAPTCHA.')));
    });
  });
}
