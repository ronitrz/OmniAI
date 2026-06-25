// src/services/ai/providers/mock.provider.ts
// Provides realistic simulated responses for providers without API keys.
// Implements the same AIProvider interface as real providers.
// The frontend has ZERO awareness that responses are mocked.

import { AIProvider, AIRequest, AIResponse, ChunkCallback, ModelInfo } from '../interfaces/ai-provider.interface';

// Dictionary of capitals
const CAPITALS: Record<string, string> = {
  india: 'New Delhi',
  france: 'Paris',
  germany: 'Berlin',
  usa: 'Washington, D.C.',
  'united states': 'Washington, D.C.',
  uk: 'London',
  'united kingdom': 'London',
  japan: 'Tokyo',
  china: 'Beijing',
  canada: 'Ottawa',
  australia: 'Canberra',
  brazil: 'Brasilia',
  italy: 'Rome',
  spain: 'Madrid',
  russia: 'Moscow',
  egypt: 'Cairo',
  'south africa': 'Pretoria',
  mexico: 'Mexico City'
};

// Dictionary of facts
const FACTS = [
  {
    keywords: ['light', 'speed'],
    answer: '299,792,458 meters per second (approx. 300,000 km/s)',
    subject: 'speed of light',
    details: 'This is the universal physical constant representing the maximum speed at which all conventional matter and information can travel in a vacuum.'
  },
  {
    keywords: ['armstrong', 'moon'],
    answer: 'Neil Armstrong',
    subject: 'first man on the moon',
    details: 'He stepped onto the lunar surface on July 20, 1969, during the Apollo 11 mission, famously stating, "That\'s one small step for [a] man, one giant leap for mankind."'
  },
  {
    keywords: ['ocean', 'largest'],
    answer: 'The Pacific Ocean',
    subject: 'largest ocean',
    details: 'It covers more than 30% of the Earth\'s surface, making it larger than all the Earth\'s land area combined.'
  },
  {
    keywords: ['gravity', 'acceleration'],
    answer: '9.81 m/s²',
    subject: 'gravitational acceleration on Earth',
    details: 'This represents the standard acceleration due to Earth\'s gravity at sea level.'
  },
  {
    keywords: ['water', 'boiling'],
    answer: '100°C (212°F) under standard atmospheric pressure',
    subject: 'boiling point of water',
    details: 'This is the temperature at which water changes state from liquid to gas at standard atmospheric pressure.'
  },
  {
    keywords: ['pi', 'value'],
    answer: '3.14159...',
    subject: 'value of Pi (π)',
    details: 'Pi is a mathematical constant representing the ratio of a circle\'s circumference to its diameter.'
  }
];

// Dictionary of technologies
const TECH_INFO: Record<string, { name: string; definition: string; details: string }> = {
  react: {
    name: 'React',
    definition: 'React is a popular open-source JavaScript library developed by Meta for building user interfaces, especially single-page web applications.',
    details: 'It is characterized by its component-based architecture, virtual DOM for high-performance rendering, and unidirectional data flow.'
  },
  angular: {
    name: 'Angular',
    definition: 'Angular is a comprehensive, open-source TypeScript-based web application framework led by Google.',
    details: 'It provides a full suite of features including dependency injection, two-way data binding, routing, and HTTP client services.'
  },
  node: {
    name: 'Node.js',
    definition: 'Node.js is a cross-platform, open-source JavaScript runtime environment built on Chrome\'s V8 Engine.',
    details: 'It executes JavaScript code outside a web browser, making it ideal for building scalable backend services and APIs via event-driven, non-blocking I/O.'
  },
  database: {
    name: 'Database',
    definition: 'A database is an organized collection of structured information, or data, typically stored electronically in a computer system.',
    details: 'It is managed by a Database Management System (DBMS) which facilitates retrieving, updating, and managing data.'
  },
  postgres: {
    name: 'PostgreSQL',
    definition: 'PostgreSQL is a powerful, open-source object-relational database system (ORDBMS).',
    details: 'It is highly regarded for its extensibility, SQL compliance, ACID compliance, and support for complex data types.'
  },
  postgresql: {
    name: 'PostgreSQL',
    definition: 'PostgreSQL is a powerful, open-source object-relational database system (ORDBMS).',
    details: 'It is highly regarded for its extensibility, SQL compliance, ACID compliance, and support for complex data types.'
  },
  mongodb: {
    name: 'MongoDB',
    definition: 'MongoDB is a leading source-available NoSQL database program.',
    details: 'It uses JSON-like documents with optional schemas (BSON format), offering high performance, high availability, and easy scaling.'
  },
  sql: {
    name: 'SQL',
    definition: 'SQL (Structured Query Language) is the standard programming language used to manage and manipulate relational databases.',
    details: 'It allows querying, updating, inserting, and deleting records in tables, as well as managing schemas and database configurations.'
  },
  nosql: {
    name: 'NoSQL',
    definition: 'NoSQL (Not Only SQL) databases are non-tabular databases that store data differently than relational tables.',
    details: 'They come in various types (document, key-value, wide-column, graph) and are designed for scalability, flexibility, and high-performance.'
  },
  typescript: {
    name: 'TypeScript',
    definition: 'TypeScript is a strongly typed programming language developed by Microsoft that builds on JavaScript.',
    details: 'It adds static typing and advanced features, compiling down to clean JavaScript for execution in any browser or environment.'
  },
  javascript: {
    name: 'JavaScript',
    definition: 'JavaScript is a lightweight, interpreted programming language with first-class functions.',
    details: 'It is best known as the scripting language for Web pages, but is also widely used in non-browser environments like Node.js.'
  }
};

// Helper to normalize prompt text for keyword matching
function normalizePrompt(prompt: string): { clean: string; words: string[] } {
  const clean = prompt
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // normalize spacing
    .trim();
  const words = clean.split(" ").filter(w => w.length > 0);
  return { clean, words };
}

// Strip prefixes to extract subject
function extractSubject(prompt: string): string {
  let clean = prompt.trim();
  // Strip trailing question mark/punctuation
  clean = clean.replace(/[?.\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

  const prefixesToStrip = [
    /^what is the capital of\s+/i,
    /^what is the capital city of\s+/i,
    /^what is capital of\s+/i,
    /^what is capital city of\s+/i,
    /^tell me the capital of\s+/i,
    /^tell capital of\s+/i,
    /^tell me capital of\s+/i,
    /^capital of\s+/i,
    /^capital city of\s+/i,
    /^what is the\s+/i,
    /^what is a\s+/i,
    /^what is an\s+/i,
    /^what is\s+/i,
    /^what are the\s+/i,
    /^what are\s+/i,
    /^who is the\s+/i,
    /^who is\s+/i,
    /^who was the\s+/i,
    /^who was\s+/i,
    /^where is the\s+/i,
    /^where is\s+/i,
    /^define\s+/i,
    /^definition of\s+/i,
    /^explain\s+/i,
    /^how to\s+/i,
    /^how do i\s+/i,
    /^how does\s+/i,
    /^tell me about\s+/i,
    /^tell me\s+/i,
    /^info on\s+/i,
    /^information on\s+/i,
    /^opinion on\s+/i,
    /^recommendations for\s+/i,
    /^recommendation on\s+/i,
    /^recommend\s+/i,
    /^please explain\s+/i,
    /^do you know about\s+/i,
    /^do you know\s+/i,
    /^can you explain\s+/i,
    /^can you tell me about\s+/i,
    /^can you tell me\s+/i
  ];

  for (const regex of prefixesToStrip) {
    if (regex.test(clean)) {
      clean = clean.replace(regex, "");
      break;
    }
  }

  // Also trim trailing/leading "capital" if present (e.g. "india capital")
  clean = clean.replace(/\s+capital$/i, "");
  clean = clean.replace(/^capital\s+/i, "");

  return clean.trim();
}

function capitalizeSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to evaluate math expressions in the prompt
function evaluateMathPrompt(prompt: string): { expr: string; result: number } | null {
  const cleanPrompt = prompt.trim().toLowerCase();
  // Detect standard math queries (e.g. 2 + 2, 10 * 10, calculate 3 / 2)
  const mathRegex = /(?:what is|calculate|evaluate|solve)?\s*([\d\s+\-*\/().]+)\s*\??$/i;
  const match = cleanPrompt.match(mathRegex);
  if (match) {
    const expr = match[1].replace(/\s+/g, '');
    // Safety check: only allow digits and valid math characters, and make sure there is at least one operator
    if (/^[\d+\-*\/().]+$/.test(expr) && /[\d]+/.test(expr) && /[\+\-\*\/]/.test(expr)) {
      try {
        // Safe evaluation of mathematical expression
        const result = Function(`"use strict"; return (${expr})`)();
        if (typeof result === 'number' && !isNaN(result)) {
          return { expr: match[1].trim(), result };
        }
      } catch (e) {
        // ignore math parse error
      }
    }
  }
  return null;
}

// Dynamically generate response based on prompt and model type
export function generatePromptAwareResponse(prompt: string, modelId: string): string {
  const { clean, words } = normalizePrompt(prompt);
  const subject = extractSubject(prompt);
  const subjectTitle = capitalizeSubject(subject);

  // 1. Greetings
  const greetingKeywords = ['hello', 'hi', 'hey', 'greetings', 'gday', 'sup', 'yo', 'welcome', 'howdy', 'morning', 'afternoon', 'evening'];
  if (words.some(w => greetingKeywords.includes(w))) {
    if (modelId === 'gpt-4o') {
      return `Hello! How can I assist you today? I am GPT-4o, ready to help with coding, analysis, or general queries.`;
    } else if (modelId === 'claude-haiku') {
      return `Hello. I am Claude. How may I help you explore this topic or solve your problem today?`;
    } else if (modelId === 'gemini-flash') {
      return `Hello! I'm Gemini, your virtual assistant. How can I help you today? Let's analyze your queries.`;
    } else { // deepseek-chat
      return `Hello. This is DeepSeek V3. System check complete. Please provide your query or instruction.`;
    }
  }

  // 2. Math evaluation
  const mathEval = evaluateMathPrompt(prompt);
  if (mathEval) {
    if (modelId === 'gpt-4o') {
      return `Based on standard arithmetic principles, the calculation for ${mathEval.expr} yields:

**Answer**: **${mathEval.result}**

This is a factual mathematical constant.`;
    } else if (modelId === 'claude-haiku') {
      return `Evaluating the mathematical expression ${mathEval.expr}:
      
The direct result of this computation is ${mathEval.result}. 

In the decimal system, this value is stable and universally accepted under first-order arithmetic axioms.`;
    } else if (modelId === 'gemini-flash') {
      return `Here is the computation result for the expression "${mathEval.expr}":

**Result**: **${mathEval.result}**

**Mathematical Context**:
- **Operation**: Arithmetic evaluation.
- **Base**: Base-10 (Decimal).
- **Properties**: Integer result.`;
    } else { // deepseek-chat
      return `Calculation request received:
- Input expression: ${mathEval.expr}
- Compilation result: ${mathEval.result}
- Status: Success

The output of ${mathEval.expr} is mathematically proven to be exactly ${mathEval.result}.`;
    }
  }

  // 3. Comparisons
  if (words.includes('vs') || words.includes('compare') || words.includes('comparison') || clean.includes('difference between')) {
    let termA = 'Option A';
    let termB = 'Option B';
    const vsIdx = words.indexOf('vs');
    if (vsIdx > 0 && vsIdx < words.length - 1) {
      termA = words[vsIdx - 1];
      termB = words[vsIdx + 1];
    } else {
      const parts = clean.split(/compare|vs|and|difference between/);
      const filteredParts = parts.map(p => p.trim()).filter(p => p.length > 0);
      if (filteredParts.length >= 2) {
        termA = filteredParts[0];
        termB = filteredParts[1];
      }
    }

    const tA = capitalizeSubject(termA);
    const tB = capitalizeSubject(termB);

    let coreComp = '';
    const infoA = TECH_INFO[termA.toLowerCase()];
    const infoB = TECH_INFO[termB.toLowerCase()];

    if (infoA && infoB) {
      coreComp = `Comparing ${tA} and ${tB}:\n- **${tA}**: ${infoA.definition}\n- **${tB}**: ${infoB.definition}`;
    } else {
      coreComp = `Comparing **${tA}** and **${tB}** reveals distinct design philosophies and trade-offs. In modern systems, choosing between ${tA} and ${tB} depends on your scaling constraints, team structure, and deployment vectors.`;
    }

    if (modelId === 'gpt-4o') {
      return `Comparing **${tA}** and **${tB}** reveals distinct trade-offs. 

${coreComp}

**Recommendation**: Default to ${tA} for rapid development, and select ${tB} if you require more integrated, standardized structures.`;
    } else if (modelId === 'claude-haiku') {
      return `Evaluating the relationship between **${tA}** and **${tB}** requires analyzing your specific organizational constraints. ${coreComp} From a systems perspective, each option optimizes for different scaling dimensions.`;
    } else if (modelId === 'gemini-flash') {
      return `Regarding your comparison between **${tA}** and **${tB}**:

**Comparison Matrix**:
- **${tA}**: Flexible, modular approach.
- **${tB}**: Structured, enterprise-scale execution.

${coreComp}`;
    } else { // deepseek-chat
      return `Comparison query received:
- Vector A: ${tA}
- Vector B: ${tB}

${coreComp}

Decision vector: Select based on your project's scaling targets and technical constraints.`;
    }
  }

  // 4. Capital Cities
  const isCapitalQuery = words.includes('capital') || words.includes('capitals') || clean.includes('capital of') || clean.includes('capital city');
  if (isCapitalQuery) {
    // Try to find if any word matches a country in the list
    const countryKey = Object.keys(CAPITALS).find(c => words.includes(c) || clean.includes(c));
    if (countryKey) {
      const capital = CAPITALS[countryKey];
      const formattedCountry = capitalizeSubject(countryKey);

      if (modelId === 'gpt-4o') {
        return `The capital of ${formattedCountry} is **${capital}**. It serves as the official political, administrative, and cultural center of the nation.`;
      } else if (modelId === 'claude-haiku') {
        return `The capital city of ${formattedCountry} is **${capital}**. From an administrative perspective, it functions as the seat of national governance and political institutions.`;
      } else if (modelId === 'gemini-flash') {
        return `The capital of ${formattedCountry} is **${capital}**. 

**Overview**:
- **Administrative Capital**: ${capital}
- **Role**: Seat of federal government.`;
      } else { // deepseek-chat
        return `Factual lookup result:
- Country: ${formattedCountry}
- Capital city: ${capital}

The official capital is verified as ${capital}.`;
      }
    } else {
      // Prompt asks for a capital of a country not in the list
      const extractedCountry = subjectTitle || 'the specified country';
      if (modelId === 'gpt-4o') {
        return `The capital of **${extractedCountry}** is a major city serving as its official administrative capital. 

While my mock database does not have the exact city name indexed, it acts as the primary political, economic, and administrative center of **${extractedCountry}**.`;
      } else if (modelId === 'claude-haiku') {
        return `Regarding the capital city of **${extractedCountry}**: From an administrative governance perspective, this city functions as the seat of national institutions and political power for the state of **${extractedCountry}**.`;
      } else if (modelId === 'gemini-flash') {
        return `Information on the capital of **${extractedCountry}**:
- **Country**: ${extractedCountry}
- **Capital**: [Offline Mock Data]
- **Role**: Official seat of governance.`;
      } else { // deepseek-chat
        return `Factual lookup: Capital of ${extractedCountry}
- Status: Key not found in static database
- Description: Official political and legislative capital of ${extractedCountry}.`;
      }
    }
  }

  // 5. Factual / Science / History queries
  for (const fact of FACTS) {
    const hasArmstrong = clean.includes('armstrong') && fact.subject.includes('armstrong');
    const hasPi = (words.includes('pi') || clean.includes('π')) && fact.subject.includes('pi');
    const allKeywordsMatch = fact.keywords.every(kw => clean.includes(kw));
    const anyKeywordsMatch = fact.keywords.filter(kw => clean.includes(kw)).length >= 2;

    if (hasArmstrong || hasPi || allKeywordsMatch || anyKeywordsMatch) {
      if (modelId === 'gpt-4o') {
        return `The answer regarding the **${fact.subject}** is **${fact.answer}**.

**Details**: ${fact.details}`;
      } else if (modelId === 'claude-haiku') {
        return `Based on established scientific and historical consensus, the answer regarding the **${fact.subject}** is **${fact.answer}**.

**Contextual Details**: ${fact.details}`;
      } else if (modelId === 'gemini-flash') {
        return `The answer for "**${fact.subject}**" is **${fact.answer}**.

**Overview**:
- **Result**: ${fact.answer}
- **Explanation**: ${fact.details}`;
      } else {
        return `Fact Verification Check:
- Subject: ${fact.subject}
- Resolved value: ${fact.answer}
- Details: ${fact.details}`;
      }
    }
  }

  // 6. Technology questions
  const techKey = Object.keys(TECH_INFO).find(k => words.includes(k) || clean.includes(k));
  if (techKey) {
    const tech = TECH_INFO[techKey];
    if (modelId === 'gpt-4o') {
      return `**${tech.name}** is a widely adopted technology in modern software development. ${tech.definition}

**Key Aspects**:
- ${tech.details}
- Robust production usage and mature ecosystem.`;
    } else if (modelId === 'claude-haiku') {
      return `**${tech.name}** represents a major paradigm in systems engineering. ${tech.definition} From an analytical perspective, it balances developer flexibility with architectural consistency, enabling teams to build scalable systems. Specifically, ${tech.details}`;
    } else if (modelId === 'gemini-flash') {
      return `**${tech.name} Overview**:

- **Definition**: ${tech.definition}
- **Technical Details**: ${tech.details}
- **Ecosystem**: Highly active developer community.`;
    } else { // deepseek-chat
      return `Technology profile check:
- Subject: ${tech.name}
- Definition: ${tech.definition}
- Technical characteristics: ${tech.details}
- Status: Production-ready infrastructure.`;
    }
  }

  // 7. Recommendations
  const isRecQuery = words.includes('recommend') || words.includes('recommendation') || words.includes('recommendations') || clean.includes('should i use') || clean.includes('what is better') || clean.includes('opinion on');
  if (isRecQuery) {
    const topicText = subjectTitle || 'this choice';
    if (modelId === 'gpt-4o') {
      return `Here is my recommendation regarding **${topicText}**:

1. **Prioritize simplicity**: Start with standard, proven designs.
2. **Evaluate trade-offs**: Assess vendor lock-in, latency, and scaling requirements.
3. **Iterate quickly**: Implement short feedback loops to validate your path.`;
    } else if (modelId === 'claude-haiku') {
      return `Analyzing your recommendation request for **${topicText}**: We must weigh the trade-offs carefully. A modular, iterative approach is generally preferred to minimize technical debt and preserve operational flexibility.`;
    } else if (modelId === 'gemini-flash') {
      return `Structured recommendation for **${topicText}**:

**Key Actions**:
- **Analyze**: Define clear requirements.
- **Select**: Match the tools to your team's skill set.
- **Iterate**: Build a minimum viable prototype first.`;
    } else { // deepseek-chat
      return `Recommendation request status: Processing
- Domain: ${topicText}
- Recommended action: Conduct a feasibility study. Choose standard, proven patterns to minimize operational risk.`;
    }
  }

  // 8. Definitions
  const isDefQuery = words.includes('define') || words.includes('definition') || clean.startsWith('what is') || clean.startsWith('what are');
  if (isDefQuery && subject) {
    if (modelId === 'gpt-4o') {
      return `**${subjectTitle}** is a fundamental concept. It represents an essential mechanism or entity used to explain, design, or optimize systems.`;
    } else if (modelId === 'claude-haiku') {
      return `From an analytical perspective, **${subjectTitle}** functions as an organizing paradigm or concept. It serves as a foundation for explaining specific phenomena or structuring complex operations.`;
    } else if (modelId === 'gemini-flash') {
      return `**${subjectTitle}** Overview:
- **Concept**: ${subjectTitle}
- **Significance**: Core structural or conceptual pillar.`;
    } else { // deepseek-chat
      return `Subject profile lookup:
- Term: ${subjectTitle}
- Class: Conceptual definition
- Status: Validated parameter`;
    }
  }

  // 9. Unknown/Fallback (Dynamic, prompt-aware)
  const displayTopic = subjectTitle || prompt;
  if (modelId === 'gpt-4o') {
    return `I understand you are asking about **${displayTopic}**. Here is a relevant response based on the available mock knowledge:

To address your query regarding **${displayTopic}**, we must analyze the key components. In standard environments, this involves evaluating your core requirements, prioritizing practical integration steps, and validating outcomes through short feedback loops.

**Recommendations for ${displayTopic}**:
1. Define the specific boundaries of your query regarding **${displayTopic}**.
2. Review established guidelines and best practices in this domain.`;
  } else if (modelId === 'claude-haiku') {
    return `I understand you are asking about **${displayTopic}**. Here is a relevant response based on the available mock knowledge:

A comprehensive analysis of **${displayTopic}** requires examining the underlying assumptions and structural dependencies. We should calibrate our approach based on the specific constraints of your environment, maintaining a stance of epistemic humility as we evaluate the available options.

**Key Considerations for ${displayTopic}**:
- Contextual applicability: The parameters of **${displayTopic}** depend heavily on scale and target objectives.
- Systematic evaluation: Compare alternative perspectives before establishing a definitive path.`;
  } else if (modelId === 'gemini-flash') {
    return `I understand you are asking about **${displayTopic}**. Here is a relevant response based on the available mock knowledge:

**Overview of ${displayTopic}**:
- **Subject Analysis**: Systematic review of the query parameters for **${displayTopic}**.
- **Key Takeaway**: Short feedback loops and clear definitions are essential.
- **Next Steps**: Benchmark your specific requirements against standard frameworks.`;
  } else { // deepseek-chat
    return `I understand you are asking about **${displayTopic}**. Here is a relevant response based on the available mock knowledge:

Factual analysis subject: **${displayTopic}**
- Query status: Unresolved in static mock database
- Analytical model: First principles decomposition

To resolve the query regarding **${displayTopic}**, it is systematically broken down into its functional requirements. We recommend defining the input vectors and measuring performance metrics before allocating development resources.`;
  }
}

// Simulated JSON output for consensus claims extraction
function mockJuryExtraction(prompt: string): string {
  const questionMatch = prompt.match(/QUESTION:\s*(.*?)\s*AI MODEL RESPONSES:/s);
  const question = questionMatch ? questionMatch[1].trim() : "the user's query";

  // Check if it's a math expression
  const mathEval = evaluateMathPrompt(question);
  if (mathEval) {
    return JSON.stringify({
      agreements: [
        `All selected models answered ${mathEval.result}.`,
        `The models agree that the expression ${mathEval.expr} evaluates exactly to ${mathEval.result}.`,
        "The models applied standard base-10 arithmetic rules consistently.",
        `No model disputed the computed value of ${mathEval.result}.`,
        "All model outputs show perfect numerical alignment."
      ],
      contradictions: [],
      uniqueInsights: [
        {
          modelId: "gpt-4o",
          insight: "GPT-4o described the result as a factual mathematical constant."
        },
        {
          modelId: "claude-haiku",
          insight: "Claude analyzed the mathematical properties using decimal base stability and first-order arithmetic axioms."
        },
        {
          modelId: "deepseek-chat",
          insight: "DeepSeek framed the output as a compilation process result."
        }
      ]
    }, null, 2);
  }

  // Check if it's a general knowledge/factual query
  const gkResponse = generatePromptAwareResponse(question, 'gpt-4o');
  let agreementConcept = question;
  if (gkResponse) {
    const boldMatch = gkResponse.match(/\*\*(.*?)\*\*/);
    if (boldMatch) agreementConcept = boldMatch[1];
  }

  return JSON.stringify({
    agreements: [
      `All selected models agreed on the core response regarding "${agreementConcept}".`,
      `The models agree on the primary definition, facts, or parameters of "${question}".`,
      "There are no contradictions or discrepancies between the model responses.",
      "The models applied consistent definitions and data points.",
      "All model outputs show perfect alignment on the primary answer."
    ],
    contradictions: [],
    uniqueInsights: [
      {
        modelId: "gpt-4o",
        insight: "GPT-4o provided a direct and practical overview."
      },
      {
        modelId: "claude-haiku",
        insight: "Claude analyzed the historical and governing significance of the subject."
      }
    ]
  }, null, 2);
}

// Simulated JSON output for consensus synthesis text
function mockJurySynthesis(prompt: string): string {
  const questionMatch = prompt.match(/ORIGINAL QUESTION:\s*(.*?)\s*AI MODEL RESPONSES/s);
  const question = questionMatch ? questionMatch[1].trim() : "the user's query";

  // Check if it's a math expression
  const mathEval = evaluateMathPrompt(question);
  if (mathEval) {
    return JSON.stringify({
      consensusText: `## Result\n\nThe answer to **${mathEval.expr}** is **${mathEval.result}**.\n\n## Explanation\n\nThis is a straightforward arithmetic computation using standard mathematical rules. The expression \`${mathEval.expr}\` is evaluated using the conventional order of operations (BODMAS/PEMDAS):\n\n- **Step 1**: Identify the operations involved\n- **Step 2**: Apply arithmetic rules in correct order\n- **Result**: \`${mathEval.result}\`\n\nThis value is universally accepted and deterministic — there is no ambiguity or interpretation required. Mathematical expressions of this kind have exactly one correct answer.\n\n## Key Takeaway\n\n**${mathEval.result}** is the definitive, exact result of this computation.`,
      recommendation: `Use ${mathEval.result} as the definitive answer — this is a mathematical constant with no ambiguity.`
    }, null, 2);
  }

  // Check if it's a capital city query
  const { words } = normalizePrompt(question);
  const isCapital = words.includes('capital');
  const countryKey = isCapital ? Object.keys(CAPITALS).find(c => words.includes(c) || question.toLowerCase().includes(c)) : null;
  if (isCapital && countryKey) {
    const capital = CAPITALS[countryKey];
    const country = countryKey.charAt(0).toUpperCase() + countryKey.slice(1);
    return JSON.stringify({
      consensusText: `## Capital of ${country}\n\nThe capital of **${country}** is **${capital}**.\n\n## Overview\n\n**${capital}** serves as the official political, administrative, and cultural capital of ${country}. As the seat of the national government, it houses the country's executive, legislative, and judicial institutions.\n\n### Key Facts\n- **Official Status**: National capital and seat of government\n- **Role**: Administrative, political, and often economic hub\n- **Significance**: Primary city through which national policy and diplomacy are conducted\n\n## Historical Context\n\n${capital} has played a central role in ${country}'s history, serving as the command center for national leadership across different political periods. Its status as capital is constitutionally recognized.\n\n## Why It Matters\n\nKnowing a country's capital is foundational for geography, political science, and international relations. **${capital}** is the correct and authoritative answer.`,
      recommendation: `Remember that ${capital} is the official, constitutionally recognized capital of ${country} — this is a definitive geographical fact.`
    }, null, 2);
  }

  // Check for technology topics
  const techKey = Object.keys(TECH_INFO).find(k => words.includes(k) || question.toLowerCase().includes(k));
  if (techKey) {
    const tech = TECH_INFO[techKey];
    return JSON.stringify({
      consensusText: `## ${tech.name}\n\n**${tech.name}** is ${tech.definition}\n\n## Core Concepts\n\n${tech.details}\n\n### Why It Matters\n\n${tech.name} has become a foundational technology in modern software development. Its widespread adoption is driven by performance, developer experience, and ecosystem maturity.\n\n### Common Use Cases\n\n- **Web Applications**: Building scalable, maintainable interfaces and services\n- **Enterprise Systems**: Large-scale deployments where reliability and structure are critical\n- **Developer Productivity**: Tools that reduce boilerplate and accelerate development cycles\n\n## Trade-offs to Consider\n\nWhile **${tech.name}** offers significant advantages, the best choice always depends on your team's expertise, project requirements, and long-term maintenance strategy.\n\n## Conclusion\n\n${tech.name} is a proven, production-ready solution with strong community support and a well-established ecosystem. It is a reliable default choice for most relevant use cases.`,
      recommendation: `Evaluate ${tech.name} against your specific project requirements — its maturity and community support make it a strong default choice for most use cases.`
    }, null, 2);
  }

  // Generic comprehensive fallback for open-ended questions
  const subject = extractSubject(question);
  const subjectTitle = capitalizeSubject(subject) || 'this topic';

  return JSON.stringify({
    consensusText: `## ${subjectTitle}\n\nHere is a comprehensive, synthesized answer to: **"${question}"**\n\n## Core Answer\n\nApproaching **${subjectTitle}** requires understanding several key dimensions that together form a complete picture:\n\n- **Foundational Clarity**: A clear grasp of core concepts is the starting point for any effective solution\n- **Practical Application**: Theory must connect to real-world constraints to be genuinely useful\n- **Context Sensitivity**: The optimal answer depends on specific goals, environment, and constraints\n\n## Detailed Analysis\n\nWhen tackling **${subjectTitle}**, systematic thinking is essential. Define the problem clearly, identify the variables at play, and evaluate both short-term needs and long-term implications. Decisions that seem optimal immediately can create technical or operational debt down the road.\n\nThe principles that broadly apply here are: **modularity**, **clarity**, and **iterative improvement**. Building in small, validated steps consistently outperforms large, sweeping solutions.\n\n## Key Considerations\n\n1. **Define requirements clearly** before selecting any approach\n2. **Evaluate trade-offs** between simplicity and capability\n3. **Start with proven patterns** — deviate only with good reason\n4. **Iterate and measure** to continuously validate your approach\n\n## Conclusion\n\nThe best path forward for **${subjectTitle}** is grounded in clear requirements, pragmatic decisions, and a commitment to continuous improvement.`,
    recommendation: `Start by clearly defining your specific requirements for ${subjectTitle}, then apply the simplest proven approach — iterate and refine from there.`
  }, null, 2);
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
  'gemini-flash': {
    id: 'gemini-flash',
    displayName: 'Gemini',
    fullName: 'Gemini Flash (Demo)',
    provider: 'mock',
    tier: 'demo',
    description: 'Google Gemini Flash — Demo Mode. Simulated responses.',
    strengths: ['Speed', 'Long context', 'Multimodal'],
    color: '#4285F4',
  },
  'deepseek-chat': {
    id: 'deepseek-chat',
    displayName: 'DeepSeek',
    fullName: 'DeepSeek V3 (Demo)',
    provider: 'mock',
    tier: 'demo',
    description: 'DeepSeek V3 — Demo Mode. Simulated responses.',
    strengths: ['Reasoning', 'Code', 'Analysis'],
    color: '#0ea5e9',
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
    const topic = 'general';

    // Get the response text for this model
    const responseText = this.getResponseText(request.prompt, topic);

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

    // Check if it's a jury extraction request
    if (request.prompt.includes('agreements') && request.prompt.includes('contradictions') && request.prompt.includes('uniqueInsights')) {
      const content = mockJuryExtraction(request.prompt);
      await sleep(500);
      return {
        content,
        modelId: this.modelId,
        latencyMs: Date.now() - startTime,
        isMock: true,
        status: 'success',
      };
    }

    // Check if it's a jury synthesis request
    if (request.prompt.includes('consensusText') && request.prompt.includes('recommendation') && request.prompt.includes('Jury Verdict')) {
      const content = mockJurySynthesis(request.prompt);
      await sleep(500);
      return {
        content,
        modelId: this.modelId,
        latencyMs: Date.now() - startTime,
        isMock: true,
        status: 'success',
      };
    }

    const content = this.getResponseText(request.prompt, 'general');
    await sleep(500); // Simulate processing delay

    return {
      content,
      modelId: this.modelId,
      latencyMs: Date.now() - startTime,
      isMock: true,
      status: 'success',
    };
  }

  /** Maps this.modelId to the correct mock response set */
  private getResponseText(prompt: string, topic: 'technical' | 'business' | 'general'): string {
    return generatePromptAwareResponse(prompt, this.modelId);
  }
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

    // Random delay between bursts: 25-75ms
    const delay = Math.floor(Math.random() * 50) + 25;
    await sleep(delay);

    if (Math.random() < 0.15) {
      await sleep(Math.floor(Math.random() * 200) + 150);
    }
  }
}
