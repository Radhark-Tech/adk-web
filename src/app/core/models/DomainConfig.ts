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

export interface DomainConfig {
  domain: {
    name: string;
    type: 'ecommerce' | 'healthcare' | 'finance' | 'education' | 'custom';
    version: string;
  };
  api: {
    baseUrl: string;
    endpoints: {
      users: string;
      permissions: string;
      roles: string;
      [key: string]: string;
    };
    authentication: {
      type: 'bearer' | 'api_key' | 'oauth';
      headerName?: string;
    };
  };
  ui: {
    features: {
      userManagement: boolean;
      roleBasedAccess: boolean;
      auditLogs: boolean;
      customFields: boolean;
    };
    userFields: DomainUserField[];
    customComponents?: string[];
  };
}

export interface DomainUserField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'boolean' | 'custom';
  required: boolean;
  searchable: boolean;
  displayInList: boolean;
  options?: string[];
  customRenderer?: string;
}
