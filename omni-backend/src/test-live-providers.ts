// src/test-live-providers.ts
import dotenv from 'dotenv';
import { providerRegistry } from './services/ai/provider-registry';

// Load .env
dotenv.config();

async function runTests() {
  console.log('=== OmniAI Provider Live Status Check ===');
  console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
  console.log('DEEPSEEK_API_KEY present:', !!process.env.DEEPSEEK_API_KEY);
  console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
  console.log('ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
  console.log('MOCK_MODE:', process.env.MOCK_MODE);
  console.log('=========================================\n');

  const testProviders = [
    { name: 'Gemini', modelId: 'gemini-flash' },
    { name: 'OpenAI', modelId: 'gpt-4o' },
    { name: 'DeepSeek', modelId: 'deepseek-chat' },
    { name: 'Anthropic', modelId: 'claude-haiku' }
  ];

  const testPrompts = [
    'hello',
    'what is the speed of light',
    'recommend a database',
    'tell me a story about a frog'
  ];

  for (const prompt of testPrompts) {
    console.log(`\n=========================================`);
    console.log(`TEST PROMPT: "${prompt}"`);
    console.log(`=========================================`);
    
    for (const p of testProviders) {
      try {
        const provider = providerRegistry.getProvider(p.modelId);
        const resp = await provider.generateResponse({
          prompt,
          history: []
        });
        console.log(`[${p.name} Output]:`);
        console.log(resp.content.trim());
        console.log(`---`);
      } catch (e: any) {
        console.error(`[${p.name} ERROR]:`, e.message || e);
      }
    }
  }
}

runTests();

