// src/app/features/chat/chat.component.ts
import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

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
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';

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
    <div class="chat-page-container">
      <!-- Floating Stream Toast -->
      <div class="toast-error animate-fade-in" *ngIf="streamError()">
        <span class="toast-icon">⚠️</span>
        <span class="toast-text">{{ streamError() }}</span>
        <button class="close-toast-btn" (click)="streamError.set(null)">×</button>
      </div>

      <!-- Chat Header -->
      <div class="chat-header glass">
        <div class="header-left">
          <button class="hamburger-btn" (click)="state.sidebarOpen.set(true)" title="Open Menu">☰</button>
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
          <!-- Session Welcome View if no messages -->
          <div class="welcome-box glass animate-fade-in" *ngIf="messagesList().length === 0 && !isGenerating()">
            <div class="icon">⚖️</div>
            <h2>Start a Consensus Debate</h2>
            <p>Select up to 4 models below, type your question, and watch them stream responses concurrently. OmniAI will then analyze their answers and output a Jury Verdict.</p>
          </div>

          <!-- Message History List -->
          <div *ngFor="let msg of messagesList()" class="message-group animate-fade-in">
            <!-- User Prompt -->
            <div class="user-message-row" *ngIf="msg.role === 'user'">
              <div class="avatar user">U</div>
              <div class="content-bubble user">
                <p>{{ msg.content }}</p>
              </div>
            </div>

            <!-- Assistant responses (Standard Grid) -->
            <div class="assistant-responses-row" *ngIf="msg.role === 'assistant' || (msg.role === 'user' && msg.responses?.length)">
              <!-- If standard mode, show grid of response cards -->
              <div *ngIf="msg.mode !== 'research'">
                <app-response-grid
                  [selectedModels]="getModelsInfoForResponses(msg.responses)"
                  [streamStates]="getStreamStatesFromResponses(msg.responses)"
                ></app-response-grid>
              </div>

              <!-- If research mode, show single document layout -->
              <div *ngIf="msg.mode === 'research'">
                <app-research-report
                  [selectedModels]="getModelsInfoForResponses(msg.responses)"
                  [streamStates]="getStreamStatesFromResponses(msg.responses)"
                ></app-research-report>
              </div>

              <!-- Jury Verdict for this specific message exchanged -->
              <app-jury-verdict
                *ngIf="msg.juryVerdict"
                [verdict]="msg.juryVerdict"
                [modelsInfo]="allModels()"
              ></app-jury-verdict>
            </div>
          </div>

          <!-- Active/Current Streaming Turn -->
          <div class="message-group active-turn animate-fade-in" *ngIf="isGenerating() || verdictLoading()">
            <!-- Current Prompt (represented in active streaming states) -->
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

            <!-- Deliberating / Deliberation Loader -->
            <div class="verdict-loading-card card glass animate-fade-in" *ngIf="verdictLoading()">
              <div class="loader-content">
                <span class="deliberation-icon">⚖️</span>
                <div class="loader-text">
                  <h3>Jury Deliberating Consensus</h3>
                  <p>Extracting claims, calculating confidence score, and synthesizing final recommendation...</p>
                </div>
                <div class="shimmer loader-bar"></div>
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
      border-radius: 6px;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 500;
      padding: 0.35rem 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background-color: var(--bg-tertiary);
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
      padding-bottom: 8rem; /* space for input bar */
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
    
    /* Verdict Loader Card */
    .verdict-loading-card {
      padding: 1.5rem;
      border-radius: 16px;
      margin-top: 1.5rem;
      border-color: rgba(99, 102, 241, 0.1);
    }
    .loader-content {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      position: relative;
      flex-wrap: wrap;
    }
    .deliberation-icon {
      font-size: 2rem;
      animation: spin-tilt 3s infinite linear;
    }
    @keyframes spin-tilt {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(10deg); }
      75% { transform: rotate(-10deg); }
      100% { transform: rotate(0deg); }
    }
    .loader-text {
      flex: 1;
    }
    .loader-text h3 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .loader-text p {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .loader-bar {
      width: 100%;
      height: 4px;
      margin-top: 0.75rem;
    }
    .toast-error {
      position: fixed;
      top: calc(var(--header-height) + 1rem);
      right: 2rem;
      background-color: rgba(239, 68, 68, 0.95);
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
}
