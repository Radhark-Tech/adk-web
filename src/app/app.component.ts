/**
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

import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {SessionService} from './core/services/session.service';
import {IframeCommunicationService} from './core/services/iframe-communication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent implements OnInit {
  title = 'agent_framework_web';
  userId: string = '';
  appName: string = '';
  sessionId: string = '';

  constructor(private iframeCommunicationService: IframeCommunicationService) {}

  ngOnInit() {
    // Subscribe to access token changes if needed
    this.iframeCommunicationService.accessToken$.subscribe(token => {
      if (token) {
        console.log('Access token received in app component:', token);
        // You can add additional logic here when token is received
      }
    });

    // Request access token from parent if we're in an iframe
    if (window.parent && window.parent !== window) {
      console.log('App is running in iframe, requesting access token...');
      this.iframeCommunicationService.requestAccessToken();
    }
  }
}
