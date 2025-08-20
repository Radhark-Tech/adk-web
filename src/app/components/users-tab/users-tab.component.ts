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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Subject, switchMap} from 'rxjs';
import {User, UserService} from '../../core/services/user.service';

@Component({
  selector: 'app-users-tab',
  templateUrl: './users-tab.component.html',
  styleUrl: './users-tab.component.scss',
  standalone: false,
})
export class UsersTabComponent implements OnInit {
  @Input() userId: string = '';
  @Input() appName: string = '';
  @Input() sessionId: string = '';
  @Input() onNewSessionClick: (() => void) | undefined;

  @Output() readonly userSelected = new EventEmitter<User>();
  @Output() readonly userReloaded = new EventEmitter<User>();

  userList: User[] = [];
  selectedUserId: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  private refreshUsersSubject = new Subject<void>();

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
  ) {
    this.refreshUsersSubject
        .pipe(
            switchMap(() => {
              this.loading = true;
              this.errorMessage = '';
              return this.userService.listUsers({
                page: 1,
                page_size: 50,
                // order_by: 'created_at',
                // direction: 'desc',
                // last_login: true // Include last login information
              });
            })
        )
        .subscribe({
          next: (response) => {
            this.userList = response.items || [];
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading users:', error);
            this.errorMessage = 'Error ao carregar usuários. Por favor, tente novamente.';
            this.loading = false;
            this.userList = [];
          }
        });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.refreshUsersSubject.next();
    }, 500);
  }

  selectUser(user: User) {
    this.selectedUserId = user.id;
    // if (!!this.selectedUserId && this.selectedUserId === user.id) {
    //   this.selectedUserId = '';
    // }
    this.userSelected.emit(user);
  }

  handleNewSessionClick() {
    if (this.onNewSessionClick) {
      this.onNewSessionClick();
    }
  }

  protected getFormattedDate(dateString: string | undefined): string {
    if (!dateString) {
      return 'Never';
    }

    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  }

  protected getUserInitial(name: string | undefined): string {
    if (!name || name.trim() === '') {
      return '?';
    }
    
    const trimmedName = name.trim();
    const spaceIndex = trimmedName.indexOf(' ');
    
    if (spaceIndex === -1 || spaceIndex === trimmedName.length - 1) {
      return trimmedName.charAt(0).toUpperCase();
    }
    
    const firstCharAfterSpace = trimmedName.charAt(spaceIndex + 1);
    
    if (/[a-zA-Z]/.test(firstCharAfterSpace)) {
      return firstCharAfterSpace.toUpperCase();
    }
    
    return firstCharAfterSpace;
  }

  refreshUsers() {
    this.refreshUsersSubject.next();
  }

  searchUsers(query: string) {
    this.userService.listUsers({
      page: 1,
      page_size: 50,
      q: query,
      order_by: 'created_at',
      direction: 'desc',
      // last_login: true
    }).subscribe({
      next: (response) => {
        this.userList = response.items || [];
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.errorMessage = 'Failed to search users. Please try again.';
        this.userList = [];
      },
    });
  }
}
