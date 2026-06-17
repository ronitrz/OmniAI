// src/services/ai/providers/mock.provider.ts
// Provides realistic simulated responses for providers without API keys.
// Implements the same AIProvider interface as real providers.
// The frontend has ZERO awareness that responses are mocked.
//
// Key features:
// - Topic detection (technical / business / general)
// - Per-model personality (GPT is direct/practical, Claude is analytical/nuanced)
// - Simulated streaming with realistic word-burst timing
// - isMock: true on all responses (stored in DB, never sent to frontend)

import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo } from '../interfaces/ai-provider.interface';

// Pre-authored responses per model per topic
// Written to sound like the real model's personality
const MOCK_RESPONSES: Record<string, Record<string, string>> = {
  'gpt-4o': {
    technical: `React remains the most pragmatic choice for new projects in 2025, and here's why.

**Ecosystem maturity**: React's npm ecosystem is unmatched. With 23 million weekly downloads and libraries like TanStack Query, Zustand, and Radix UI, you are unlikely to run into a problem without a well-maintained solution.

**Component model**: React's functional component model with hooks has aged well. The mental model is simple: components are functions of state, and hooks compose cleanly. You get predictability without the magic of Vue's Options API or Angular's dependency injection complexity.

**TypeScript integration**: With React 19 and the new compiler optimizations, TypeScript support is first-class. The JSX type inference improvements in TypeScript 5.4+ mean fewer explicit type annotations while maintaining safety.

**When to choose alternatives**:
- **Vue 3**: Better DX for teams new to frontend development. The Composition API is excellent, and the single-file component format reduces cognitive overhead for junior developers.
- **Angular**: Correct choice for enterprise applications with large teams. Opinionated structure, built-in DI, and the Angular Language Service make it more maintainable at scale.
- **Svelte**: Worth watching. Compile-time reactivity eliminates the virtual DOM overhead. Best for performance-critical applications.

**My recommendation**: Default to React for product teams. Use Vue if your team has limited frontend experience. Adopt Angular if you are building for enterprise with 10+ frontend developers.

The meta-frameworks matter more than the base library now. Next.js (React), Nuxt (Vue), and Analog (Angular) all solve SSR, routing, and bundling. Pick the ecosystem your team knows best.`,

    business: `Evaluating this from a product and business strategy lens:

**Market timing is the most underrated factor**. Speed to market determines survival for early-stage startups more than technical excellence. The best technical decision is often the one that lets your smallest viable team ship fastest.

**Build vs Buy vs Open Source**: For non-core capabilities, buy or use open source. Your competitive moat should be in domain expertise, not infrastructure. AI features are the clearest example — use APIs (OpenAI, Anthropic) rather than training models unless AI is your core product.

**The unit economics question**: Before any major product investment, model the unit economics. What is the cost to acquire a customer? What is the lifetime value? What margin does the business need to be sustainable? These answers should drive prioritization more than any technical factor.

**Customer discovery over feature building**: The most common startup failure mode is building the wrong thing. Run 20 customer discovery conversations before writing a line of code for any major feature.

**Key metrics to track from day one**:
- Weekly Active Users and retention cohorts
- Time to value (how quickly does a new user experience the core benefit?)
- Net Promoter Score from your most engaged users
- Burn rate vs runway

**Recommendation**: Focus relentlessly on the one metric that represents whether your core hypothesis is true. Everything else is a distraction until that metric is validated.`,

    general: `This is a question worth examining from multiple angles.

**The consensus view**: Most practitioners agree on the fundamentals. The evidence base has accumulated over years of research and practice, and the core principles are well-established.

**What gets debated**: The nuances and edge cases are where thoughtful people disagree. Context matters enormously — what works in one situation may not transfer to another.

**The practical answer**: Start with the approach that has the broadest support and the clearest evidence base. Iterate based on your specific context. Avoid premature optimization of your methodology.

**Three things that consistently matter**:
1. Clear problem definition before solution design
2. Feedback loops that are short enough to learn quickly
3. Willingness to revise your approach when evidence contradicts your assumptions

**What I would do**: Apply the principle that has the strongest empirical support, measure the outcome carefully, and adjust. The frameworks exist to serve results, not the other way around.

The most important insight is often the simplest: state the problem precisely, identify what you can control, and focus energy there.`,
  },

  'claude-haiku': {
    technical: `This is a question where the "right" answer depends heavily on context that matters more than any framework's inherent qualities.

**The case for React**: React's dominance reflects genuine technical merit, not just momentum. The unidirectional data flow model makes debugging predictable. When something breaks, you trace state changes through a clear hierarchy. This is genuinely valuable at scale.

That said, it is worth acknowledging what React does not give you for free: routing, state management beyond useState/useContext, and form handling all require third-party libraries. You are assembling a framework rather than adopting one.

**The case for Vue 3**: Vue's Composition API is underappreciated. It achieves a similar component model to React hooks while the single-file component format keeps concerns co-located in a way that reduces cognitive switching. For teams where most developers are not specialists, Vue has a meaningfully gentler learning curve.

**The case for Angular**: Angular's strongest argument is not productivity for a single developer — it is consistency across large teams. When Angular makes an opinionated choice (routing, HTTP client, forms), every Angular developer knows where to look. That constraint has real value when the team grows beyond five people.

**The considerations often ignored**:
- Team familiarity outweighs theoretical framework advantages in most cases
- Hiring market matters — React developers are most available
- Meta-framework ecosystem (Next.js, Nuxt, Analog) may matter more than the base library
- Long-term maintainability depends on team discipline more than framework choice

**My analysis**: If I were advising a team without existing preferences, I would recommend React with Next.js for most product applications, Vue 3 with Nuxt for teams newer to frontend development, and Angular for applications that genuinely need enterprise-scale structure.`,

    business: `There are several dimensions worth examining carefully here.

**The strategic framing question**: Is this primarily a growth problem, a retention problem, or a unit economics problem? These require fundamentally different approaches, and conflating them leads to unfocused execution.

**What the evidence suggests**: The businesses that compound most effectively tend to do so through retention rather than acquisition. A customer who returns and refers others is worth dramatically more than one acquired and lost. This suggests that investment in product quality and customer success often generates better returns than marketing spend, especially in the early stages.

**The organizational dimension**: Strategy fails more often in execution than in conception. Before committing to any strategic direction, it is worth asking: does this organization have the capabilities to execute this well? A mediocre strategy executed with excellence typically outperforms a brilliant strategy executed poorly.

**The risks worth taking seriously**:
- Market timing risk: even correct insights fail if executed too early or too late
- Resource concentration risk: focus is powerful but creates fragility
- Assumption risk: strategy rests on assumptions that may not hold

**A more nuanced recommendation**: Rather than committing to a single strategic direction based on current information, I would suggest running smaller experiments that test your core assumptions before scaling. The cost of being wrong is lower when the bets are smaller.`,

    general: `I want to engage with this carefully because it touches on genuinely contested ground.

**Where there is strong agreement**: Across most perspectives, certain foundational elements emerge consistently. The evidence for these core principles is robust, and they hold across a wide range of contexts.

**Where thoughtful people disagree**: The application and weighting of principles varies by context. What looks like disagreement is often a difference in which factors are being prioritized, rather than a fundamental conflict in values or analysis.

**The epistemological challenge**: Our confidence in any position should be calibrated to the quality of evidence supporting it. For well-studied questions, higher confidence is warranted. For novel or context-dependent questions, epistemic humility is the appropriate stance.

**How I would approach this**:
First, identify what is actually knowable with confidence versus what requires a judgment call under uncertainty. Then apply the most defensible approach to the knowable parts while remaining genuinely open to revision on the uncertain parts.

The most sophisticated analysts I am aware of hold their views with appropriate tentativeness — confident enough to act, humble enough to update when evidence changes.

**In practice**: The answer that serves you best is the one that correctly identifies the most important variables in your specific situation, not the one that applies a general principle most elegantly.`,
  },
};

// Detect topic category from the prompt text
function detectTopic(prompt: string): 'technical' | 'business' | 'general' {
  const lower = prompt.toLowerCase();

  const technicalKeywords = [
    'code', 'programming', 'framework', 'library', 'api', 'database', 'algorithm',
    'architecture', 'software', 'system', 'react', 'angular', 'vue', 'node', 'python',
    'typescript', 'javascript', 'backend', 'frontend', 'deploy', 'server', 'cloud',
    'microservice', 'docker', 'kubernetes', 'git', 'testing', 'debug', 'performance',
  ];

  const businessKeywords = [
    'startup', 'business', 'market', 'revenue', 'customer', 'product', 'strategy',
    'growth', 'monetize', 'saas', 'pricing', 'competition', 'investment', 'funding',
    'entrepreneur', 'b2b', 'b2c', 'retention', 'acquisition', 'churn', 'mvp',
  ];

  const technicalScore = technicalKeywords.filter(k => lower.includes(k)).length;
  const businessScore = businessKeywords.filter(k => lower.includes(k)).length;

  if (technicalScore > businessScore && technicalScore > 0) return 'technical';
  if (businessScore > technicalScore && businessScore > 0) return 'business';
  return 'general';
}

// Simulate realistic streaming — word bursts with variable timing
async function simulateStreaming(
  text: string,
  modelId: string,
  onChunk: ChunkCallback
): Promise<void> {
  const words = text.split(' ');
  let i = 0;

  while (i < words.length) {
    // Burst 3-7 words at a time
    const burstSize = Math.floor(Math.random() * 5) + 3;
    const burst = words.slice(i, i + burstSize).join(' ') + ' ';
    onChunk(burst, modelId);
    i += burstSize;

    // Random delay between bursts: 25-75ms (mimics real model token timing)
    const delay = Math.floor(Math.random() * 50) + 25;
    await sleep(delay);

    // Occasional longer pause (15% chance) to simulate "thinking"
    if (Math.random() < 0.15) {
      await sleep(Math.floor(Math.random() * 200) + 150);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// MODEL_CONFIGS defines the display info for each mock model
const MODEL_CONFIGS: Record<string, ModelInfo> = {
  'gpt-4o': {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    fullName: 'GPT-4o (Demo)',
    provider: 'mock',
    tier: 'demo',
    description: 'OpenAI GPT-4o — Demo Mode. Simulated responses.',
    strengths: ['Code', 'Instruction following', 'Tool use'],
    color: '#10a37f',
  },
  'claude-haiku': {
    id: 'claude-haiku',
    displayName: 'Claude',
    fullName: 'Claude Haiku (Demo)',
    provider: 'mock',
    tier: 'demo',
    description: 'Anthropic Claude Haiku — Demo Mode. Simulated responses.',
    strengths: ['Analysis', 'Nuanced reasoning', 'Writing'],
    color: '#c9a227',
  },
};

export class MockProvider implements AIProvider {
  private modelId: string;
  private info: ModelInfo;

  constructor(modelId: string) {
    this.modelId = modelId;
    this.info = MODEL_CONFIGS[modelId] ?? {
      id: modelId,
      displayName: modelId,
      fullName: `${modelId} (Demo)`,
      provider: 'mock',
      tier: 'demo',
      description: 'Demo Mode',
      strengths: [],
      color: '#6366f1',
    };
  }

  getModelInfo(): ModelInfo {
    return this.info;
  }

  isAvailable(): boolean {
    return true; // MockProvider is always available
  }

  async streamResponse(request: AIRequest, onChunk: ChunkCallback): Promise<AIResponse> {
    const startTime = Date.now();
    const topic = detectTopic(request.prompt);

    // Get the response text for this model + topic
    const modelKey = this.modelId.includes('gpt') ? 'gpt-4o' : 'claude-haiku';
    const responseText =
      MOCK_RESPONSES[modelKey]?.[topic] ??
      MOCK_RESPONSES[modelKey]?.['general'] ??
      'I can provide analysis on this topic. The key considerations involve balancing multiple competing factors while maintaining focus on the core objective.';

    // Simulate the initial "thinking" delay real models have
    await sleep(Math.floor(Math.random() * 500) + 300);

    // Stream the response word by word
    await simulateStreaming(responseText, this.modelId, onChunk);

    return {
      content: responseText,
      modelId: this.modelId,
      latencyMs: Date.now() - startTime,
      isMock: true,
      status: 'success',
    };
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const topic = detectTopic(request.prompt);
    const modelKey = this.modelId.includes('gpt') ? 'gpt-4o' : 'claude-haiku';
    const content =
      MOCK_RESPONSES[modelKey]?.[topic] ??
      MOCK_RESPONSES[modelKey]?.['general'] ??
      'Analysis complete.';

    await sleep(500); // Simulate processing delay

    return {
      content,
      modelId: this.modelId,
      latencyMs: Date.now() - startTime,
      isMock: true,
      status: 'success',
    };
  }
}
