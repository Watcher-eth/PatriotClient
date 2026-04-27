import { DocsLayout } from '../../../components/docs/docs-layout'
import { CodeBlock } from '../../../components/docs/code-block'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SdkPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            INTERFACES / SDK
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            SDK
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Native SDKs for TypeScript, Python, Go, and Rust provide type-safe 
            interfaces with async support and automatic retry handling.
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex gap-4 flex-wrap">
          <div className="px-4 py-2 border-b-2 border-[#dc2626] text-[#e5e5e5] text-xs tracking-wider">
            TYPESCRIPT
          </div>
          <div className="px-4 py-2 text-[#737373] text-xs tracking-wider hover:text-[#a3a3a3] cursor-pointer">
            PYTHON
          </div>
          <div className="px-4 py-2 text-[#737373] text-xs tracking-wider hover:text-[#a3a3a3] cursor-pointer">
            GO
          </div>
          <div className="px-4 py-2 text-[#737373] text-xs tracking-wider hover:text-[#a3a3a3] cursor-pointer">
            RUST
          </div>
        </div>

        {/* Installation */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            INSTALLATION
          </h2>
          
          <CodeBlock
            filename="terminal"
            language="bash"
            code={`# npm
npm install @patriot/sdk

# pnpm
pnpm add @patriot/sdk

# yarn
yarn add @patriot/sdk`}
          />
        </section>

        {/* Basic Usage */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            BASIC USAGE
          </h2>
          
          <CodeBlock
            filename="client.ts"
            language="typescript"
            code={`import { PatriotClient } from '@patriot/sdk';

// Initialize the client
const patriot = new PatriotClient({
  endpoint: process.env.PATRIOT_ENDPOINT,
  apiKey: process.env.PATRIOT_API_KEY,
  
  // Optional configuration
  timeout: 30000,
  retries: 3,
});

// Submit a task
const task = await patriot.tasks.submit({
  type: 'process-data',
  input: {
    source: 's3://bucket/data.json',
    destination: 's3://bucket/output/',
  },
  priority: 'HIGH',
});

console.log(\`Task ID: \${task.id}\`);
console.log(\`Status: \${task.status}\`);`}
          />
        </section>

        {/* Async Operations */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ASYNC OPERATIONS
          </h2>
          
          <CodeBlock
            filename="async.ts"
            language="typescript"
            code={`// Wait for task completion
const result = await task.wait({
  timeout: '30m',
  pollInterval: 1000,
});

// Or use event-based approach
task.on('progress', (event) => {
  console.log(\`Progress: \${event.percent}%\`);
});

task.on('completed', (result) => {
  console.log('Task completed:', result);
});

task.on('failed', (error) => {
  console.error('Task failed:', error);
});

// Stream logs
for await (const log of task.streamLogs()) {
  console.log(\`[\${log.timestamp}] \${log.message}\`);
}`}
          />
        </section>

        {/* Type Definitions */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            TYPE DEFINITIONS
          </h2>
          
          <CodeBlock
            filename="types.ts"
            language="typescript"
            code={`import type { 
  Task, 
  TaskStatus, 
  TaskResult,
  Worker,
  Batch,
} from '@patriot/sdk';

// Task status enum
type TaskStatus = 
  | 'PENDING'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// Task interface
interface Task<TInput = unknown, TOutput = unknown> {
  id: string;
  type: string;
  status: TaskStatus;
  input: TInput;
  output?: TOutput;
  error?: TaskError;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  workerId?: string;
}

// Custom task types
interface ProcessDataInput {
  source: string;
  destination: string;
  format?: 'json' | 'csv';
}

interface ProcessDataOutput {
  recordsProcessed: number;
  outputUrl: string;
}

// Type-safe task submission
const task = await patriot.tasks.submit<
  ProcessDataInput, 
  ProcessDataOutput
>({
  type: 'process-data',
  input: {
    source: 's3://bucket/data.json',
    destination: 's3://bucket/output/',
  },
});`}
          />
        </section>

        {/* Error Handling */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ERROR HANDLING
          </h2>
          
          <CodeBlock
            filename="errors.ts"
            language="typescript"
            code={`import { 
  PatriotError, 
  TaskTimeoutError,
  RateLimitError,
  AuthenticationError,
} from '@patriot/sdk';

try {
  const result = await task.wait({ timeout: '5m' });
} catch (error) {
  if (error instanceof TaskTimeoutError) {
    console.log('Task timed out, cancelling...');
    await task.cancel();
  } else if (error instanceof RateLimitError) {
    console.log(\`Rate limited, retry after \${error.retryAfter}s\`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else {
    throw error;
  }
}`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/interfaces/cli"
              className="group flex items-center gap-2 p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  CLI
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs"
              className="group flex items-center justify-center p-4 border border-[#dc2626] bg-[#dc2626]/10 hover:bg-[#dc2626]/20 transition-colors flex-1"
            >
              <span className="text-xs tracking-wide text-[#dc2626]">
                BACK TO DOCUMENTATION INDEX
              </span>
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  )
}
