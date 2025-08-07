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

import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {URLUtil} from '../../../utils/url-util';
import { IframeCommunicationService } from './iframe-communication.service';

export interface User {
  id: string;
  name: string;
  email: string;
  status?: string;
  created_at?: string;
  last_login?: string;
  role?: string;
  [key: string]: any; // Allow for domain-specific fields
}

export interface UserListResponse {
  items: User[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  q?: string;
  order_by?: string;
  direction?: 'asc' | 'desc';
  roles_ids?: string;
  show_with_plan?: boolean;
  status?: string;
  first_login?: boolean;
  last_login?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  //private apiServerDomain = URLUtil.getDomainApiServerBaseUrl();
  private apiServerDomain = URLUtil.getApiServerBaseUrl();

//   constructor(private http: HttpClient) {}
  constructor(
    private http: HttpClient,
    private iframeCommunicationService: IframeCommunicationService
  ) {}

  /**
   * Get headers with access token if available
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    
    const token = this.iframeCommunicationService.getAccessToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('UserService error:', error);
    
    if (error.status === 401) {
      // Token might be expired or invalid
      this.iframeCommunicationService.clearAccessToken();
      this.iframeCommunicationService.requestAccessToken();
      return throwError(() => new Error('Authentication failed. Please try again.'));
    }
    
    return throwError(() => new Error(error.error?.message || 'An error occurred'));
  }

  /**
   * List users via ADK agent (which handles domain API authentication)
   */
  listUsers(params?: UserListParams): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    
    // Build parameters for ADK agent
    if (params) {
      if (params.page !== undefined) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.page_size !== undefined) {
        httpParams = httpParams.set('page_size', params.page_size.toString());
      }
      if (params.q) {
        httpParams = httpParams.set('q', params.q);
      }
      if (params.order_by) {
        httpParams = httpParams.set('order_by', params.order_by);
      }
      if (params.direction) {
        httpParams = httpParams.set('direction', params.direction);
      }
      if (params.roles_ids) {
        httpParams = httpParams.set('roles_ids', params.roles_ids);
      }
      if (params.show_with_plan !== undefined) {
        httpParams = httpParams.set('show_with_plan', params.show_with_plan.toString());
      }
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.first_login !== undefined) {
        httpParams = httpParams.set('first_login', params.first_login.toString());
      }
      if (params.last_login !== undefined) {
        httpParams = httpParams.set('last_login', params.last_login.toString());
      }
    }

    // Call ADK agent endpoint which will proxy to domain API
    return this.http.get<UserListResponse>(
      `${this.apiServerDomain}/domain/lll/api/v1/users`,
      { 
        params: httpParams, 
        headers: this.getHeaders(),
      }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get a specific user by ID via ADK agent
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(
      `${this.apiServerDomain}/api/v1/users/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
