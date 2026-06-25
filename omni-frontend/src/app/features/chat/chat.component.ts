// src/app/features/chat/chat.component.ts
import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
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
        <div class="toast-error animate-fade-in" *ngIf="streamError()">
          <span class="toast-text">{{ streamError() }}</span>
          <button class="close-toast-btn" (click)="streamError.set(null)">×</button>
        </div>

        <!-- Chat Header -->
        <div class="chat-header glass">
          <div class="header-left">
            <button class="hamburger-btn" (click)="state.toggleSidebar()" title="Toggle Sidebar">☰</button>
            <button class="back-btn" *ngIf="auth.currentUser() && state.activeWorkspaceId()" [routerLink]="['/workspace', state.activeWorkspaceId()]">
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
            <div class="welcome-box glass animate-fade-in" *ngIf="messagesList().length === 0 && !isGenerating()">
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
                    Responses
                  </button>
                  <button 
                    type="button" 
                    class="session-tab-btn" 
                    [class.active]="getActiveTab(msg.id) === 'consensus'"
                    (click)="setActiveTab(msg.id, 'consensus')"
                  >
                    Jury Verdict
                  </button>
                  <button 
                    type="button" 
                    class="session-tab-btn" 
                    [class.active]="getActiveTab(msg.id) === 'compare'"
                    (click)="setActiveTab(msg.id, 'compare')"
                  >
                    Compare Matrix
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
                                    <!-- OpenAI SVG -->
                                    <svg *ngIf="modelResponse.modelId === 'gpt-4o'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                                    </svg>
                                    <!-- Gemini SVG -->
                                    <svg *ngIf="modelResponse.modelId === 'gemini-flash'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/>
                                    </svg>
                                    <!-- Claude SVG -->
                                    <svg *ngIf="modelResponse.modelId === 'claude-haiku'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>
                                    </svg>
                                    <!-- DeepSeek SVG -->
                                    <svg *ngIf="modelResponse.modelId === 'deepseek-chat'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"/>
                                    </svg>
                                    <svg *ngIf="!modelResponse.modelId" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-3-9a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 11zm6 0a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 15 11zm-6 4a3 3 0 0 0 6 0Z"/>
                                    </svg>
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

              <div class="verdict-loading-card glass animate-fade-in" *ngIf="verdictLoading()">
                <div class="loader-content">
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
                          <!-- OpenAI SVG -->
                          <svg *ngIf="modelResponse.modelId === 'gpt-4o'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                          </svg>
                          <!-- Gemini SVG -->
                          <svg *ngIf="modelResponse.modelId === 'gemini-flash'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/>
                          </svg>
                          <!-- Claude SVG -->
                          <svg *ngIf="modelResponse.modelId === 'claude-haiku'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                            <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>
                          </svg>
                          <!-- DeepSeek SVG -->
                          <svg *ngIf="modelResponse.modelId === 'deepseek-chat'" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"/>
                          </svg>
                          <svg *ngIf="!modelResponse.modelId" class="model-logo-svg-mini" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-3-9a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 11zm6 0a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 15 11zm-6 4a3 3 0 0 0 6 0Z"/>
                          </svg>
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
    
    .model-logo-svg-mini {
      width: 12px;
      height: 12px;
      color: #ffffff;
      display: block;
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
  auth = inject(AuthService);

  private autoSendEvent: any = null;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    this.autoSendEvent = navigation?.extras?.state?.['autoSendEvent'];
  }

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

        if (this.autoSendEvent) {
          const event = this.autoSendEvent;
          this.autoSendEvent = null; // clear it
          setTimeout(() => {
            this.onSendMessage(event);
          }, 150);
        }
      } else {
        // Clear active session/workspace if navigating to root "/"
        this.sessionId.set(null);
        this.state.activeSessionId.set(null);
        this.messagesList.set([]);
        this.sessionTitle.set('New Conversation');
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
        this.router.navigate(['/']);
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
    if (!this.auth.currentUser()) {
      this.state.authModalType.set('login');
      return;
    }

    const sid = this.sessionId();
    if (!sid) {
      // Auto-create workspace & session for logged-in users starting chat from root "/"
      this.isGenerating.set(true); // show loader immediately
      let wsId = this.state.activeWorkspaceId() || (this.state.workspaces().length > 0 ? this.state.workspaces()[0].id : null);
      
      const createSessionAndSend = (targetWsId: string) => {
        this.api.post<{ session: any }>(`/workspaces/${targetWsId}/sessions`, {
          title: event.content.slice(0, 30) || 'New Conversation'
        }).subscribe({
          next: (sessionRes) => {
            this.state.activeWorkspaceId.set(targetWsId);
            this.state.loadSidebarSessions(targetWsId);
            // Navigate to the session route and pass the autoSendEvent in state
            this.router.navigate(['/session', sessionRes.session.id], {
              state: { autoSendEvent: event }
            });
          },
          error: (err) => {
            this.isGenerating.set(false);
            this.streamError.set('Failed to create session. Please try again.');
          }
        });
      };

      if (!wsId) {
        // Create default workspace
        this.api.post<{ workspace: any }>('/workspaces', {
          name: 'My Workspace',
          description: 'Default personal workspace'
        }).subscribe({
          next: (wsRes) => {
            this.state.workspaces.update(list => [...list, wsRes.workspace]);
            createSessionAndSend(wsRes.workspace.id);
          },
          error: (err) => {
            this.isGenerating.set(false);
            this.streamError.set('Failed to initialize workspace. Please try again.');
          }
        });
      } else {
        createSessionAndSend(wsId);
      }
      return;
    }

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
