// src/app/features/chat/chat.component.ts
import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { SseService, SseEvent } from '../../core/services/sse.service';
import { WorkspaceStateService } from '../../core/services/workspace-state.service';
import { ModelInfo } from './model-selector/model-selector.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { ResponseGridComponent } from './response-grid/response-grid.component';
import { JuryVerdictComponent } from './jury-verdict/jury-verdict.component';
import { ResearchReportComponent } from './research-report/research-report.component';
import { CardStreamState } from './response-card/response-card.component';
import { JuryVerdict } from '../../shared/models/verdict.model';
import { Message, ModelResponse } from '../../shared/models/message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ChatInputComponent,
    ResponseGridComponent,
    JuryVerdictComponent,
    ResearchReportComponent
  ],
  template: `
    <div class="chat-page-container" [class.right-panel-active]="rightPanelOpen()">
      <div class="chat-main-area">
        <!-- Floating Stream Toast -->
        <div class="toast-error animate-fade-in" *ngIf="streamError()">
          <span class="toast-icon">⚠️</span>
          <span class="toast-text">{{ streamError() }}</span>
          <button class="close-toast-btn" (click)="streamError.set(null)">×</button>
        </div>

        <!-- Chat Header -->
        <div class="chat-header glass">
          <div class="header-left">
            <button class="hamburger-btn" (click)="state.toggleSidebar()" title="Toggle Sidebar">☰</button>
            <button class="back-btn" [routerLink]="['/dashboard/workspace', state.activeWorkspaceId()]">
              ← Back
            </button>
            <div class="session-info">
              <h1 class="session-title">{{ sessionTitle() }}</h1>
              <span class="session-subtitle">Multi-AI Consensus Room</span>
            </div>
          </div>
          <div class="header-right" *ngIf="isGenerating() || verdictLoading()">
            <span class="status-indicator animate-pulse">
              {{ isGenerating() ? 'Streaming AI Answers...' : 'Consensus Jury Deliberating...' }}
            </span>
          </div>
        </div>

        <!-- Chat Conversation Messages (Scrollable) -->
        <div class="chat-messages-area" #scrollContainer>
          <div class="messages-list">
            <!-- Welcome message for new sessions -->
            <div class="welcome-box glass animate-fade-in" *ngIf="messagesList().length === 0 && !isGenerating()">
              <span class="icon">⚖️</span>
              <h2>AI Consensus Room</h2>
              <p>Type a prompt below to consult multiple AI engines. The Jury system will compile the results, highlight disagreements, and recommend the best synthesized answer.</p>
            </div>

            <!-- Messages Stream -->
            <div 
              *ngFor="let msg of messagesList(); let i = index" 
              class="message-group animate-fade-in"
            >
              <!-- User prompt message row -->
              <div class="user-message-row" *ngIf="msg.role === 'user'">
                <div class="avatar user">U</div>
                <div class="content-bubble user">
                  <p>{{ msg.content }}</p>
                </div>
              </div>

              <!-- Assistant responses (Standard Grid or Research Layout) -->
              <div class="assistant-responses-row" *ngIf="msg.role === 'assistant' || (msg.role === 'user' && msg.responses?.length)">
                
                <!-- Segmented View Tabs (Only when juryVerdict is present and not research mode) -->
                <div class="session-tab-header" *ngIf="msg.juryVerdict && msg.mode !== 'research'">
                  <button 
                    type="button" 
                    class="session-tab-btn" 
                    [class.active]="getActiveTab(msg.id) === 'responses'"
                    (click)="setActiveTab(msg.id, 'responses')"
                  >
                    💬 Responses
                  </button>
                  <button 
                    type="button" 
                    class="session-tab-btn" 
                    [class.active]="getActiveTab(msg.id) === 'consensus'"
                    (click)="setActiveTab(msg.id, 'consensus')"
                  >
                    ⚖️ Jury Verdict
                  </button>
                  <button 
                    type="button" 
                    class="session-tab-btn" 
                    [class.active]="getActiveTab(msg.id) === 'compare'"
                    (click)="setActiveTab(msg.id, 'compare')"
                  >
                    📊 Compare Matrix
                  </button>
                  
                  <div class="tab-spacer"></div>
                  
                  <button 
                    type="button" 
                    class="session-tab-btn dock-panel-btn"
                    [class.active]="rightPanelOpen() && rightPanelMessage()?.id === msg.id"
                    (click)="toggleRightPanel(msg)"
                    [title]="rightPanelOpen() && rightPanelMessage()?.id === msg.id ? 'Undock split-view panel' : 'Open in split-view panel on the right'"
                  >
                    {{ rightPanelOpen() && rightPanelMessage()?.id === msg.id ? '◨ Undock Panel' : '◧ Dock Side-Panel' }}
                  </button>
                </div>

                <!-- Content body depending on Mode / Active Tab -->
                <div *ngIf="msg.mode === 'research'">
                  <app-research-report
                    [selectedModels]="getModelsInfoForResponses(msg.responses)"
                    [streamStates]="getStreamStatesFromResponses(msg.responses)"
                  ></app-research-report>
                </div>

                <div *ngIf="msg.mode !== 'research'">
                  <!-- Tab 1: Responses Grid -->
                  <div *ngIf="!msg.juryVerdict || getActiveTab(msg.id) === 'responses'" class="tab-content-wrapper animate-fade-in">
                    <app-response-grid
                      [selectedModels]="getModelsInfoForResponses(msg.responses)"
                      [streamStates]="getStreamStatesFromResponses(msg.responses)"
                      [sharedPhrases]="msg.juryVerdict ? computeSharedPhrases(msg.responses) : []"
                    ></app-response-grid>
                  </div>

                  <!-- Tab 2: Jury Verdict dashboard -->
                  <div *ngIf="msg.juryVerdict && getActiveTab(msg.id) === 'consensus'" class="tab-content-wrapper animate-fade-in">
                    <app-jury-verdict
                      [verdict]="msg.juryVerdict"
                      [modelsInfo]="allModels()"
                    ></app-jury-verdict>
                  </div>

                  <!-- Tab 3: Comparison Matrix Table -->
                  <div *ngIf="msg.juryVerdict && getActiveTab(msg.id) === 'compare'" class="tab-content-wrapper animate-fade-in">
                    <div class="comparison-view card glass">
                      <h3 class="comparison-title">Model Response Comparison</h3>
                      <div class="table-container">
                        <table class="comparison-table">
                          <thead>
                            <tr>
                              <th>Model Name</th>
                              <th>Tier / Latency</th>
                              <th>Core Summary</th>
                              <th>Unique Insight</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr *ngFor="let modelResponse of msg.responses">
                              <td class="model-cell">
                                <div class="model-meta">
                                  <span class="model-avatar" [style.background]="getAvatarGradient(modelResponse.modelId)">
                                    {{ getModelSymbol(modelResponse.modelId) }}
                                  </span>
                                  <span class="model-name">{{ getModelDisplayName(modelResponse.modelId) }}</span>
                                </div>
                              </td>
                              <td>
                                <span class="badge-capsule" [class.live]="modelResponse.status === 'success'" [class.demo]="modelResponse.isMock">
                                  {{ modelResponse.isMock ? 'DEMO' : 'LIVE' }}
                                </span>
                                <span class="latency" *ngIf="modelResponse.latencyMs">
                                  {{ (modelResponse.latencyMs / 1000).toFixed(2) }}s
                                </span>
                              </td>
                              <td>
                                <p class="summary-text">{{ getCoreSummary(modelResponse.content) }}</p>
                              </td>
                              <td>
                                <p class="insight-text">
                                  {{ getModelUniqueInsight(msg.juryVerdict, modelResponse.modelId) || 'Included in main consensus agreements' }}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active/Current Streaming Turn -->
            <div class="message-group active-turn animate-fade-in" *ngIf="isGenerating() || verdictLoading()">
              <!-- Current Prompt -->
              <div class="user-message-row">
                <div class="avatar user">U</div>
                <div class="content-bubble user">
                  <p>{{ currentPromptText() }}</p>
                </div>
              </div>

              <!-- Current Streaming Cards (Standard Mode) -->
              <div class="assistant-responses-row" *ngIf="currentMode() === 'standard'">
                <app-response-grid
                  [selectedModels]="activeSelectedModelsInfo()"
                  [streamStates]="activeStreamStates()"
                ></app-response-grid>
              </div>

              <!-- Current Streaming Report (Research Mode) -->
              <div class="assistant-responses-row" *ngIf="currentMode() === 'research'">
                <app-research-report
                  [selectedModels]="activeSelectedModelsInfo()"
                  [streamStates]="activeStreamStates()"
                ></app-research-report>
              </div>

              <!-- Redesigned Deliberating loader -->
              <div class="verdict-loading-card glass animate-fade-in" *ngIf="verdictLoading()">
                <div class="loader-content">
                  <span class="deliberation-icon">⚖️</span>
                  <div class="loader-text">
                    <h3>Jury Deliberating Consensus</h3>
                    <p>Resolving contradictions, parsing models' claims, and synthesizing final recommendations...</p>
                  </div>
                  <div class="loader-progress-container">
                    <div class="loader-progress-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Bottom Input Bar (Fixed) -->
        <div class="chat-input-area glass">
          <app-chat-input
            [models]="allModels()"
            [selectedIds]="selectedModelIds()"
            [mode]="currentMode()"
            [disabled]="isGenerating() || verdictLoading()"
            (sendMessage)="onSendMessage($event)"
            (modelSelectionChanged)="onModelSelectionChange($event)"
            (modeChanged)="currentMode.set($event)"
          ></app-chat-input>
        </div>
      </div>

      <!-- Right Side Collapsible Split-View Drawer -->
      <div class="chat-right-panel glass animate-fade-in" *ngIf="rightPanelOpen() && rightPanelMessage() as msg">
        <div class="panel-header">
          <div class="panel-title-area">
            <span class="panel-icon">⚖️</span>
            <span class="panel-title">Consensus Dock</span>
          </div>
          
          <div class="panel-tabs">
            <button 
              type="button"
              class="panel-tab-btn" 
              [class.active]="rightPanelType() === 'consensus'"
              (click)="rightPanelType.set('consensus')"
            >
              Verdict
            </button>
            <button 
              type="button"
              class="panel-tab-btn" 
              [class.active]="rightPanelType() === 'compare'"
              (click)="rightPanelType.set('compare')"
            >
              Comparison
            </button>
          </div>
          
          <button type="button" class="close-panel-btn" (click)="closeRightPanel()" title="Close Split Panel">×</button>
        </div>
        
        <div class="panel-body">
          <!-- Jury Verdict Dashboard inside Panel -->
          <div class="panel-content" *ngIf="rightPanelType() === 'consensus'">
            <app-jury-verdict
              [verdict]="msg.juryVerdict"
              [modelsInfo]="allModels()"
            ></app-jury-verdict>
          </div>
          
          <!-- Comparison Table inside Panel -->
          <div class="panel-content compare-panel-view" *ngIf="rightPanelType() === 'compare'">
            <h3 class="comparison-title">Model Response Comparison</h3>
            <div class="table-container">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th>Model Name</th>
                    <th>Latency</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let modelResponse of msg.responses">
                    <td class="model-cell">
                      <div class="model-meta">
                        <span class="model-avatar" [style.background]="getAvatarGradient(modelResponse.modelId)">
                          {{ getModelSymbol(modelResponse.modelId) }}
                        </span>
                        <span class="model-name">{{ getModelDisplayName(modelResponse.modelId) }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="latency" *ngIf="modelResponse.latencyMs">
                        {{ (modelResponse.latencyMs / 1000).toFixed(2) }}s
                      </span>
                    </td>
                    <td>
                      <p class="summary-text">{{ getCoreSummary(modelResponse.content) }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-page-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: relative;
    }
    .chat-header {
      height: var(--header-height);
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-light);
      background-color: var(--bg-secondary);
      z-index: 5;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .back-btn {
      background: none;
      border: 1px solid var(--border-light);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 500;
      padding: 0.35rem 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background-color: var(--bg-tertiary);
      border-color: var(--border-hover);
      color: var(--text-primary);
    }
    .session-info {
      display: flex;
      flex-direction: column;
    }
    .session-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
    .session-subtitle {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-indicator {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      background-color: var(--primary-glow);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
    }
    .animate-pulse {
      animation: pulse-op 1.5s infinite alternate;
    }
    @keyframes pulse-op {
      from { opacity: 0.6; }
      to { opacity: 1; }
    }
    
    .chat-messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
    .messages-list {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      padding-bottom: 18rem; /* space for input bar */
    }
    .welcome-box {
      padding: 3rem;
      border-radius: 16px;
      text-align: center;
      max-width: 600px;
      margin: 4rem auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .welcome-box .icon {
      font-size: 3rem;
    }
    .welcome-box h2 {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .welcome-box p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    
    .message-group {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .user-message-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      max-width: 80%;
      align-self: flex-start;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .avatar.user {
      background-color: var(--bg-tertiary);
      color: var(--text-secondary);
      border: 1px solid var(--border-light);
    }
    .content-bubble {
      padding: 0.75rem 1.25rem;
      border-radius: 14px;
      font-size: 0.9375rem;
      line-height: 1.5;
    }
    .content-bubble.user {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-light);
      color: var(--text-primary);
      border-top-left-radius: 2px;
    }
    .assistant-responses-row {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    /* Input area overlay styling */
    .chat-input-area {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 4rem);
      max-width: 1000px;
      z-index: 5;
      border-radius: 16px;
      box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.3);
    }
    
    /* Floating Error Toast */
    .toast-error {
      position: fixed;
      top: calc(var(--header-height) + 1rem);
      right: 2rem;
      background-color: rgba(244, 63, 94, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-size: 0.8125rem;
      font-weight: 500;
    }
    .close-toast-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
      padding-left: 0.5rem;
    }
    .close-toast-btn:hover {
      color: #fff;
    }

    /* Segmented view switcher inside messaging */
    .session-tab-header {
      display: flex;
      background-color: var(--bg-tab-header, rgba(3, 7, 18, 0.4));
      padding: 0.25rem;
      border-radius: 10px;
      gap: 0.25rem;
      width: 100%;
      margin-bottom: 0.25rem;
      border: 1px solid var(--border-light);
      align-items: center;
    }
    
    .session-tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.4rem 0.875rem;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    
    .session-tab-btn:hover {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.02);
    }
    
    .session-tab-btn.active {
      color: var(--text-primary);
      background-color: var(--bg-tab-active, rgba(255, 255, 255, 0.06));
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    /* Redesigned Deliberation Loader */
    .verdict-loading-card {
      padding: 2.25rem;
      border-radius: 20px;
      margin-top: 1.5rem;
      border: 1px solid rgba(99, 102, 241, 0.2);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(3, 7, 18, 0.45) 100%);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }
    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 1.25rem;
    }
    .deliberation-icon {
      font-size: 2.5rem;
      animation: spin-tilt 3s infinite linear;
    }
    @keyframes spin-tilt {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(10deg); }
      75% { transform: rotate(-10deg); }
      100% { transform: rotate(0deg); }
    }
    .loader-text h3 {
      font-size: 1.125rem;
      font-weight: 750;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      letter-spacing: -0.01em;
    }
    .loader-text p {
      font-size: 0.875rem;
      color: var(--text-muted);
      max-width: 500px;
      line-height: 1.5;
    }
    .loader-progress-container {
      width: 100%;
      max-width: 320px;
      height: 4px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 0.5rem;
      position: relative;
    }
    .loader-progress-bar {
      height: 100%;
      width: 40%;
      background: linear-gradient(to right, var(--primary), var(--primary-hover));
      border-radius: 9999px;
      animation: sweep 1.5s infinite ease-in-out;
    }
    @keyframes sweep {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(250%); }
    }

    /* Comparison View Card Styles */
    .comparison-view {
      padding: 1.75rem;
      border-radius: 16px;
      border: 1px solid var(--border-light) !important;
      background: var(--bg-tertiary) !important;
      color: var(--text-secondary) !important;
      box-shadow: var(--shadow-card);
    }
    .comparison-title {
      font-size: 1.125rem;
      font-weight: 750;
      color: var(--text-primary) !important;
      margin-bottom: 1.5rem;
      letter-spacing: -0.01em;
    }
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--border-light) !important;
      border-radius: 12px;
      background-color: var(--bg-tertiary) !important;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.8125rem;
    }
    .comparison-table th {
      background-color: var(--bg-secondary) !important;
      color: var(--text-primary) !important;
      font-weight: 700;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--border-light) !important;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.6875rem;
    }
    .comparison-table td {
      padding: 1.125rem 1.25rem;
      border-bottom: 1px solid var(--border-light) !important;
      color: var(--text-secondary) !important;
      vertical-align: top;
      line-height: 1.5;
    }
    .comparison-table tr:last-child td {
      border-bottom: none;
    }
    .model-cell {
      font-weight: 700;
      color: var(--text-primary) !important;
    }
    .model-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .comparison-table .model-avatar {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      color: #fff;
      font-weight: 700;
      box-shadow: inset 0 1px rgba(255,255,255,0.15), 0 1px 4px rgba(0,0,0,0.3);
    }
    .comparison-table .model-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary) !important;
    }
    .comparison-table .badge-capsule {
      display: inline-flex;
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      border: 1px solid transparent;
      letter-spacing: 0.05em;
    }
    .comparison-table .badge-capsule.live {
      background-color: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
      color: var(--color-live);
    }
    .comparison-table .badge-capsule.demo {
      background-color: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
      color: var(--color-demo);
    }
    .comparison-table .latency {
      font-size: 0.75rem;
      color: var(--primary-hover) !important;
      margin-left: 0.5rem;
      font-weight: 600;
    }
    .comparison-table .summary-text {
      color: var(--text-secondary) !important;
    }
    .comparison-table .insight-text {
      color: var(--text-muted) !important;
      font-style: italic;
    }

    /* Right Split panel styles */
    .chat-page-container {
      display: flex;
      flex-direction: row;
      height: 100vh;
      width: 100%;
      position: relative;
      overflow: hidden;
    }
    
    .chat-main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-width: 0;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @media (min-width: 1024px) {
      .chat-page-container.right-panel-active .chat-main-area {
        flex: 0 0 60%;
        max-width: 60%;
        border-right: 1px solid var(--border-light);
      }
    }
    
    .chat-right-panel {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--border-light);
      background-color: var(--bg-secondary);
      z-index: 10;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }


    @media (min-width: 1024px) {
      .chat-right-panel {
        width: 40%;
        max-width: 40%;
      }
    }
    
    @media (max-width: 1023px) {
      .chat-right-panel {
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        z-index: 150;
      }
    }
    
    .panel-header {
      height: var(--header-height);
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-light);
      background-color: var(--bg-tertiary);
    }
    
    .panel-title-area {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .panel-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .panel-tabs {
      display: flex;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 0.2rem;
      border-radius: 8px;
      gap: 0.25rem;
    }
    .light-theme .panel-tabs {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .panel-tab-btn {
      background: none;
      border: none;
      padding: 0.3rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .panel-tab-btn.active {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      box-shadow: var(--shadow-card);
    }
    
    .close-panel-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }
    .close-panel-btn:hover {
      color: var(--text-primary);
    }
    
    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    /* Spacer for tab header */
    .tab-spacer {
      flex: 1;
    }
    
    .dock-panel-btn {
      background-color: var(--primary-glow) !important;
      border: 1px solid var(--border-light) !important;
      color: var(--primary) !important;
      font-weight: 600 !important;
      margin-left: 0.5rem;
    }
    .dock-panel-btn:hover {
      background-color: rgba(139, 92, 246, 0.2) !important;
      color: var(--text-primary) !important;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private sseService = inject(SseService);
  state = inject(WorkspaceStateService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  sessionId = signal<string | null>(null);
  sessionTitle = signal<string>('New Conversation');
  streamError = signal<string | null>(null);
  
  // Model info Cache
  allModels = signal<ModelInfo[]>([]);
  
  // Selection/Mode state
  selectedModelIds = signal<Set<string>>(new Set());
  currentMode = signal<'standard' | 'research'>('standard');
  
  // Messages List
  messagesList = signal<any[]>([]);
  
  // Generation / Streaming states (Active Turn)
  isGenerating = signal<boolean>(false);
  verdictLoading = signal<boolean>(false);
  currentPromptText = signal<string>('');
  activeStreamStates = signal<Record<string, CardStreamState>>({});

  // Active Tab state for each message ID
  activeTabsMap: Record<string, 'responses' | 'consensus' | 'compare'> = {};
  
  // Right Sliding Panel states
  rightPanelOpen = signal<boolean>(false);
  rightPanelType = signal<'consensus' | 'compare'>('consensus');
  rightPanelMessage = signal<any | null>(null);

  toggleRightPanel(msg: any): void {
    if (this.rightPanelOpen() && this.rightPanelMessage()?.id === msg.id) {
      this.closeRightPanel();
    } else {
      this.rightPanelMessage.set(msg);
      this.rightPanelOpen.set(true);
      // Switch inline tab back to responses
      this.setActiveTab(msg.id, 'responses');
    }
  }

  closeRightPanel(): void {
    this.rightPanelOpen.set(false);
  }
  
  // Polling fallback configuration
  private pollingIntervalId: any = null;
  private sseSubscription: Subscription | null = null;
  private shouldScroll = false;

  ngOnInit(): void {
    // Load models list
    this.api.get<{ models: ModelInfo[] }>('/providers/models').subscribe({
      next: (res) => {
        this.allModels.set(res.models);
        // Default select all 4 models initially
        this.selectedModelIds.set(new Set(res.models.map(m => m.id)));
      },
      error: () => {}
    });

    // Subscribe to session route changes
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.sessionId.set(id);
        this.state.activeSessionId.set(id);
        this.loadSessionHistory(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  loadSessionHistory(id: string): void {
    this.api.get<{ messages: Message[], session: any }>(`/sessions/${id}/messages`).subscribe({
      next: (res) => {
        this.sessionTitle.set(res.session.title);
        this.state.activeWorkspaceId.set(res.session.workspaceId);
        
        // Populate messages list. We group user prompts and their corresponding responses
        const grouped: any[] = [];
        let currentGroup: any = null;
        
        for (const msg of res.messages) {
          if (msg.role === 'user') {
            currentGroup = {
              id: msg.id,
              role: 'user',
              content: msg.content,
              mode: msg.mode,
              responses: msg.responses || [],
              juryVerdict: msg.juryVerdict || null
            };
            grouped.push(currentGroup);
          }
        }
        
        this.messagesList.set(grouped);
        this.shouldScroll = true;
      },
      error: () => {
        this.state.clear();
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onModelSelectionChange(updated: Set<string>): void {
    this.selectedModelIds.set(updated);
  }

  activeSelectedModelsInfo(): ModelInfo[] {
    const activeIds = this.selectedModelIds();
    return this.allModels().filter(m => activeIds.has(m.id));
  }

  onSendMessage(event: { content: string; selectedModels: string[]; mode: 'standard' | 'research' }): void {
    const sid = this.sessionId();
    if (!sid) return;

    this.currentPromptText.set(event.content);
    this.currentMode.set(event.mode);
    this.isGenerating.set(true);
    this.verdictLoading.set(false);
    this.shouldScroll = true;

    // Initialize stream states
    const states: Record<string, CardStreamState> = {};
    for (const mid of event.selectedModels) {
      states[mid] = { status: 'idle', content: '' };
    }
    this.activeStreamStates.set(states);

    // POST message
    this.api.post<{ messageId: string }>(`/sessions/${sid}/messages`, event).subscribe({
      next: (res) => {
        const messageId = res.messageId;
        this.startSSEConnection(messageId);
        
        // Refresh sidebar sessions (in case title changed or new session was added)
        const wsId = this.state.activeWorkspaceId();
        if (wsId) {
          this.state.loadSidebarSessions(wsId);
          // Reload history list header to get the auto-generated title if it was "New Conversation"
          this.api.get<{ session: any }>(`/sessions/${sid}/messages`).subscribe(sh => {
            this.sessionTitle.set(sh.session.title);
          });
        }
      },
      error: (err) => {
        console.error('Failed to create message:', err);
        this.streamError.set(err.error?.message || 'Failed to send message. Please try again.');
        setTimeout(() => this.streamError.set(null), 5000);
        this.isGenerating.set(false);
      }
    });
  }

  private startSSEConnection(messageId: string): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }

    this.sseSubscription = this.sseService.connect(messageId).subscribe({
      next: (event: SseEvent) => {
        this.handleSseEvent(event);
      },
      error: (err) => {
        console.error('SSE Stream error, falling back to HTTP polling...', err);
        this.streamError.set('Connection lost. Switching to backup polling mode...');
        setTimeout(() => this.streamError.set(null), 4000);
        this.startPollingFallback(messageId);
      },
      complete: () => {
        this.triggerJuryVerdict(messageId);
      }
    });
  }

  private handleSseEvent(event: SseEvent): void {
    const states = { ...this.activeStreamStates() };
    const mid = event.modelId;
    if (!mid || !states[mid]) return;

    switch (event.event) {
      case 'model-start':
        states[mid] = { ...states[mid], status: 'streaming' };
        break;
      case 'model-chunk':
        states[mid] = { 
          ...states[mid], 
          status: 'streaming', 
          content: states[mid].content + (event.chunk || '') 
        };
        this.shouldScroll = true;
        break;
      case 'model-end':
        states[mid] = { 
          ...states[mid], 
          status: 'complete', 
          latencyMs: event.latencyMs 
        };
        break;
      case 'model-error':
        states[mid] = { 
          ...states[mid], 
          status: 'error', 
          error: event.error || 'Connection closed with error' 
        };
        break;
    }

    this.activeStreamStates.set(states);
  }

  private triggerJuryVerdict(messageId: string): void {
    this.isGenerating.set(false);
    this.verdictLoading.set(true);
    this.shouldScroll = true;

    this.api.post<{ juryVerdict: JuryVerdict }>(`/messages/${messageId}/jury`, {}).subscribe({
      next: (res) => {
        this.verdictLoading.set(false);
        // Refresh session history to display the new finished turn cleanly
        const sid = this.sessionId();
        if (sid) {
          this.loadSessionHistory(sid);
        }
      },
      error: (err) => {
        console.error('Jury synthesis failed:', err);
        this.verdictLoading.set(false);
        const sid = this.sessionId();
        if (sid) {
          this.loadSessionHistory(sid);
        }
      }
    });
  }

  // ── Polling Fallback Strategy ─────────────────────────────────────────────

  private startPollingFallback(messageId: string): void {
    this.stopPolling();
    
    // Poll the message history every 2 seconds to check if generation is done
    this.pollingIntervalId = setInterval(() => {
      this.api.get<{ messages: Message[] }>(`/sessions/${this.sessionId()}/messages`).subscribe({
        next: (res) => {
          const userMsg = res.messages.find(m => m.id === messageId);
          if (!userMsg || !userMsg.responses) return;

          const states = { ...this.activeStreamStates() };
          let allDone = true;

          for (const resp of userMsg.responses) {
            states[resp.modelId] = {
              status: resp.status === 'success' ? 'complete' : 'error',
              content: resp.content,
              latencyMs: resp.latencyMs || undefined,
              error: resp.status === 'error' ? 'Failed to generate response' : undefined
            };
            if (resp.status === 'success' || resp.status === 'error') {
              // finished for this model
            } else {
              allDone = false;
            }
          }

          // If all selected models have finished, check if jury verdict is generated or compile it
          this.activeStreamStates.set(states);
          this.shouldScroll = true;

          // If the backend has already registered responses for all selected models
          const completedCount = userMsg.responses.length;
          const targetCount = this.selectedModelIds().size;

          if (completedCount >= targetCount || allDone) {
            this.stopPolling();
            this.triggerJuryVerdict(messageId);
          }
        },
        error: () => this.stopPolling()
      });
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  // ── Helper formatters for past history list ───────────────────────────────

  getModelsInfoForResponses(responses: ModelResponse[]): ModelInfo[] {
    const list: ModelInfo[] = [];
    for (const r of responses) {
      const info = this.allModels().find(m => m.id === r.modelId);
      if (info) {
        list.push(info);
      } else {
        list.push({
          id: r.modelId,
          displayName: r.modelName,
          fullName: r.modelName,
          provider: 'unknown',
          tier: 'demo',
          description: '',
          strengths: [],
          color: '#9ca3af'
        });
      }
    }
    return list;
  }

  getStreamStatesFromResponses(responses: ModelResponse[]): Record<string, CardStreamState> {
    const states: Record<string, CardStreamState> = {};
    for (const r of responses) {
      states[r.modelId] = {
        status: r.status === 'success' ? 'complete' : 'error',
        content: r.content,
        latencyMs: r.latencyMs || undefined
      };
    }
    return states;
  }

  // ── Tab Management per Message Row ───────────────────────────
  getActiveTab(msgId: string): 'responses' | 'consensus' | 'compare' {
    return this.activeTabsMap[msgId] || 'responses';
  }

  setActiveTab(msgId: string, tab: 'responses' | 'consensus' | 'compare'): void {
    this.activeTabsMap[msgId] = tab;
  }

  getAvatarGradient(modelId: string): string {
    if (modelId === 'gpt-4o') {
      return 'linear-gradient(135deg, #10a37f 0%, #15803d 100%)';
    }
    if (modelId === 'gemini-flash') {
      return 'linear-gradient(135deg, #4285f4 0%, #7c3aed 100%)';
    }
    if (modelId === 'claude-haiku') {
      return 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
    }
    if (modelId === 'deepseek-chat') {
      return 'linear-gradient(135deg, #0ea5e9 0%, #1e40af 100%)';
    }
    return 'linear-gradient(135deg, #6366f1 0%, #000 100%)';
  }

  getModelDisplayName(modelId: string): string {
    const found = this.allModels().find(m => m.id === modelId);
    return found ? found.displayName : modelId;
  }

  getCoreSummary(content: string): string {
    if (!content) return '';
    // Clean markdown content to yield a plain text summary
    const clean = content
      .replace(/#+\s+[^\n]+/g, '') // remove headers
      .replace(/\*\*|__/g, '') // remove bold
      .replace(/`[^`]+`/g, '') // remove code
      .replace(/```[\s\S]+?```/g, '') // remove block code
      .replace(/^[*\-]\s+/gm, '') // remove bullets
      .replace(/<[^>]+>/g, '') // remove HTML
      .replace(/\s+/g, ' ') // normalize whitespace
      .trim();

    if (clean.length > 150) {
      return clean.slice(0, 147) + '...';
    }
    return clean;
  }

  getModelUniqueInsight(verdict: JuryVerdict | null, modelId: string): string {
    if (!verdict || !verdict.uniqueInsights) return '';
    const found = verdict.uniqueInsights.find(ui => ui.modelId === modelId);
    return found ? found.insight : '';
  }

  getModelSymbol(modelId: string): string {
    if (modelId === 'gpt-4o') return '⁕';
    if (modelId === 'gemini-flash') return '✦';
    if (modelId === 'claude-haiku') return '▲';
    if (modelId === 'deepseek-chat') return '◎';
    return '🤖';
  }

  /**
   * Finds sentences/phrases that appear (normalized) in 2 or more model responses.
   * Used to highlight shared content across model response cards.
   */
  computeSharedPhrases(responses: ModelResponse[]): string[] {
    if (!responses || responses.length < 2) return [];

    // Extract sentences from each response
    const allSentences = responses.map(r => {
      return r.content
        .replace(/#+\s/g, '') // strip markdown headers
        .replace(/\*\*|__/g, '') // strip bold
        .replace(/\n+/g, ' ') // collapse newlines
        .split(/(?<=[.!?])\s+/) // split on sentence boundaries
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length >= 20); // min length to be meaningful
    });

    const shared: string[] = [];
    const seen = new Set<string>();

    // Find sentences present in at least 2 responses
    for (let i = 0; i < allSentences.length; i++) {
      for (const sentence of allSentences[i]) {
        if (seen.has(sentence)) continue;
        let matchCount = 0;
        for (let j = 0; j < allSentences.length; j++) {
          if (allSentences[j].some(s => s.includes(sentence) || sentence.includes(s))) {
            matchCount++;
          }
        }
        if (matchCount >= 2) {
          shared.push(sentence);
          seen.add(sentence);
        }
      }
    }

    return shared.slice(0, 20); // cap at 20 shared phrases
  }
}
