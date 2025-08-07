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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, firstValueFrom} from 'rxjs';
import {URLUtil} from '../../../utils/url-util';
import {DomainConfig, DomainUserField} from '../models/DomainConfig';

@Injectable({
  providedIn: 'root',
})
export class DomainService {
  private domainConfig: DomainConfig | null = null;
  private configSubject = new BehaviorSubject<DomainConfig | null>(null);
  public config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load domain configuration from ADK agent
   */
  async loadDomainConfig(): Promise<DomainConfig> {
    try {
      const apiServerDomain = URLUtil.getApiServerBaseUrl();
      const config = await firstValueFrom(
        this.http.get<DomainConfig>(`${apiServerDomain}/api/v1/domain/config`)
      );
      
      this.domainConfig = config;
      this.configSubject.next(config);
      return config;
    } catch (error) {
      console.error('Failed to load domain config:', error);
      
      // Return default configuration if loading fails
      const defaultConfig: DomainConfig = {
        domain: {
          name: 'Default Domain',
          type: 'custom',
          version: '1.0.0'
        },
        api: {
          baseUrl: URLUtil.getApiServerBaseUrl(),
          endpoints: {
            users: '/api/v1/users',
            roles: '/api/v1/roles',
            permissions: '/api/v1/permissions'
          },
          authentication: {
            type: 'bearer'
          }
        },
        ui: {
          features: {
            userManagement: true,
            roleBasedAccess: true,
            auditLogs: false,
            customFields: true
          },
          userFields: [
            {
              key: 'id',
              label: 'ID',
              type: 'text',
              required: true,
              searchable: true,
              displayInList: false
            },
            {
              key: 'name',
              label: 'Name',
              type: 'text',
              required: true,
              searchable: true,
              displayInList: true
            },
            {
              key: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              searchable: true,
              displayInList: true
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: ['active', 'inactive', 'pending'],
              required: false,
              searchable: true,
              displayInList: true
            },
            {
              key: 'last_login',
              label: 'Last Login',
              type: 'date',
              required: false,
              searchable: false,
              displayInList: true
            }
          ]
        }
      };
      
      this.domainConfig = defaultConfig;
      this.configSubject.next(defaultConfig);
      return defaultConfig;
    }
  }

  /**
   * Get current domain configuration
   */
  getConfig(): DomainConfig | null {
    return this.domainConfig;
  }

  /**
   * Check if a feature is enabled for this domain
   */
  isFeatureEnabled(feature: keyof DomainConfig['ui']['features']): boolean {
    return this.domainConfig?.ui.features[feature] ?? false;
  }

  /**
   * Get domain-specific user fields
   */
  getUserFields(): DomainUserField[] {
    return this.domainConfig?.ui.userFields ?? [];
  }

  /**
   * Get user fields that should be displayed in the list
   */
  getDisplayFields(): DomainUserField[] {
    return this.getUserFields().filter(field => field.displayInList);
  }

  /**
   * Get searchable user fields
   */
  getSearchableFields(): DomainUserField[] {
    return this.getUserFields().filter(field => field.searchable);
  }

  /**
   * Get API endpoint for a specific resource
   */
  getEndpoint(resource: string): string {
    const config = this.getConfig();
    if (!config) {
      return '';
    }
    
    const baseUrl = config.api.baseUrl;
    const endpoint = config.api.endpoints[resource] ?? '';
    
    // If endpoint already contains the base URL, return as is
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Combine base URL with endpoint
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Get authentication headers based on domain configuration
   */
  getAuthHeaders(): { [key: string]: string } {
    const config = this.getConfig();
    if (!config) {
      return {};
    }

    const headers: { [key: string]: string } = {};
    
    switch (config.api.authentication.type) {
      case 'bearer':
        const token = localStorage.getItem('domain_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        break;
      case 'api_key':
        const apiKey = localStorage.getItem('domain_api_key');
        const headerName = config.api.authentication.headerName || 'X-API-Key';
        if (apiKey) {
          headers[headerName] = apiKey;
        }
        break;
      // OAuth can be implemented later if needed
    }
    
    return headers;
  }

  /**
   * Initialize domain service - should be called on app startup
   */
  async initialize(): Promise<void> {
    await this.loadDomainConfig();
  }
}
