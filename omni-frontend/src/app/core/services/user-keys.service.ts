// src/app/core/services/user-keys.service.ts
// Manages user-supplied API keys stored in localStorage.
// Keys are NEVER sent to the backend for storage — they live client-side only.

import { Injectable, signal, computed } from '@angular/core';

export interface UserApiKeys {
  openai?: string;
  gemini?: string;
  anthropic?: string;
  deepseek?: string;
}

const STORAGE_KEY = 'omni_user_api_keys';

@Injectable({
  providedIn: 'root'
})
export class UserKeysService {
  private _keys = signal<UserApiKeys>(this.loadFromStorage());

  /** Read-only signal of the current keys */
  readonly keys = this._keys.asReadonly();

  /** True when at least one key is configured */
  readonly hasAnyKey = computed(() => {
    const k = this._keys();
    return !!(k.openai || k.gemini || k.anthropic || k.deepseek);
  });

  /** Returns an object with only the providers that have keys set */
  getConfiguredKeys(): UserApiKeys {
    return { ...this._keys() };
  }

  /** Returns the JSON string of configured keys for the request header, or null */
  getHeaderValue(): string | null {
    const keys = this._keys();
    const filtered: Record<string, string> = {};
    if (keys.openai) filtered['openai'] = keys.openai;
    if (keys.gemini) filtered['gemini'] = keys.gemini;
    if (keys.anthropic) filtered['anthropic'] = keys.anthropic;
    if (keys.deepseek) filtered['deepseek'] = keys.deepseek;
    return Object.keys(filtered).length > 0 ? JSON.stringify(filtered) : null;
  }

  /** Save a single provider key */
  setKey(provider: keyof UserApiKeys, value: string): void {
    const trimmed = value.trim();
    this._keys.update(k => ({ ...k, [provider]: trimmed || undefined }));
    this.persist();
  }

  /** Remove a single provider key */
  removeKey(provider: keyof UserApiKeys): void {
    this._keys.update(k => {
      const copy = { ...k };
      delete copy[provider];
      return copy;
    });
    this.persist();
  }

  /** Remove all stored keys */
  clearAll(): void {
    this._keys.set({});
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Returns true if the given provider has a key configured */
  hasKey(provider: keyof UserApiKeys): boolean {
    return !!this._keys()[provider];
  }

  private persist(): void {
    const keys = this._keys();
    const toStore: Record<string, string> = {};
    if (keys.openai) toStore['openai'] = keys.openai;
    if (keys.gemini) toStore['gemini'] = keys.gemini;
    if (keys.anthropic) toStore['anthropic'] = keys.anthropic;
    if (keys.deepseek) toStore['deepseek'] = keys.deepseek;
    if (Object.keys(toStore).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private loadFromStorage(): UserApiKeys {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as UserApiKeys;
      }
    } catch {
      // ignore
    }
    return {};
  }
}
