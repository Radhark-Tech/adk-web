/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IframeCommunicationService implements OnDestroy {
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this.accessTokenSubject.asObservable();
  
  private messageListener?: (event: MessageEvent) => void;

  constructor() {
    this.initializeMessageListener();
    
    // Check for existing token in localStorage on service initialization
    const existingToken = localStorage.getItem('domain_access_token');
    if (existingToken) {
      this.accessTokenSubject.next(existingToken);
    }
    
    // Listen for custom events from main.ts
    window.addEventListener('accessTokenReceived', (event: any) => {
      const { accessToken } = event.detail;
      if (accessToken) {
        this.accessTokenSubject.next(accessToken);
      }
    });
  }

  private initializeMessageListener() {
    this.messageListener = (event: MessageEvent) => {
      // Validate origin - make this configurable
      const allowedOrigins = [
        "https://portal.carreiramedica.pucpr.br",
        "http://localhost:3000", // Parent app in development
        "http://localhost:4200", // For local development (same origin)
        "http://localhost:8080", // Additional dev port
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }

      const { accessToken, type } = event.data;
      
      // Handle the parent's message format: { accessToken: "fake-access-token" }
      if (accessToken) {
        console.log("Received access token in iframe:", accessToken);
        this.setAccessToken(accessToken);
      }
      
      // Handle other message types if needed
      if (type === 'REQUEST_AUTH_TOKEN') {
        console.log("Parent requested auth token");
        // Could send back a response if needed
      }
    };

    window.addEventListener("message", this.messageListener);
  }

  private setAccessToken(token: string): void {
    // Store the token
    localStorage.setItem('domain_access_token', token);
    
    // Notify subscribers
    this.accessTokenSubject.next(token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('domain_access_token');
  }

  clearAccessToken(): void {
    localStorage.removeItem('domain_access_token');
    this.accessTokenSubject.next(null);
  }

  /**
   * Check if we have a valid access token
   */
  hasAccessToken(): boolean {
    const token = this.getAccessToken();
    return token !== null && token.length > 0;
  }

  /**
   * Send a message to parent window requesting access token
   */
  requestAccessToken(): void {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_AUTH_TOKEN' }, '*');
    }
  }

  ngOnDestroy() {
    if (this.messageListener) {
      window.removeEventListener("message", this.messageListener);
    }
  }
}
