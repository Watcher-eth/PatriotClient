import { DocsLayout } from '../../../components/docs/docs-layout'
import { CodeBlock } from '../../../components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function PersistencePage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            CONTROL PLANE / PERSISTENCE
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            PERSISTENCE MODEL
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot uses a file-backed store as the source of truth with optional 
            Postgres mirroring for querying and analytics.
          </p>
        </div>

        {/* Storage Architecture */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            STORAGE ARCHITECTURE
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] p-6 font-mono">
            <pre className="text-xs leading-loose text-[#a3a3a3] overflow-x-auto">
{`PATRIOT_DATA/
├── sessions/
│   ├── {session_id}/
│   │   ├── session.json        # Session metadata
│   │   ├── runs/
│   │   │   └── {run_id}/
│   │   │       ├── run.json    # Run state
│   │   │       ├── events.jsonl # Event log
│   │   │       └── evidence/   # Artifacts
│   │   └── reduced_state.json  # Accumulated evidence
├── workers/
│   └── {worker_id}.json        # Worker profiles
├── field-sensors/
│   └── {sensor_id}.json        # Sensor registrations
└── artifacts/
    └── {hash}/                  # Content-addressed storage`}
            </pre>
          </div>
        </section>

        {/* Data Entities */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            DATA ENTITIES
          </h2>
          
          <CodeBlock
            filename="lib/controlplane/types.ts"
            language="typescript"
            code={`// Session: top-level container
interface Session {
  id: string
  createdAt: string
  status: 'active' | 'completed' | 'archived'
  
  // Accumulated evidence across runs
  reducedState: ReducedEvidenceState
  
  // Worker assignments
  claimedWorkers: WorkerClaim[]
}

// Run: single prompt-to-completion cycle
interface Run {
  id: string
  sessionId: string
  prompt: string
  
  // Routing decision
  routingIntent: RoutingIntent
  selectedWorker: WorkerRef | null
  
  // Execution state
  status: 'pending' | 'running' | 'completed' | 'failed'
  assignments: Assignment[]
  
  // Output
  output: string
  evidence: Evidence[]
  verdict: SupervisorVerdict
}

// Worker: registered execution environment
interface Worker {
  id: string
  type: WorkerType
  platform: Platform
  capabilities: string[]
  status: 'online' | 'offline' | 'degraded'
  lastSeen: string
}`}
          />
        </section>

        {/* Postgres Mirroring */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            POSTGRES MIRRORING
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Optional Postgres mirroring enables SQL queries for analytics, search, 
            and reporting without affecting the file-based source of truth.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">MIRRORED</h3>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  Session metadata
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  Run summaries
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  Worker registrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  Findings (searchable)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  Assets (indexed)
                </li>
              </ul>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">FILE-ONLY</h3>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#737373]" />
                  Raw tool output
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#737373]" />
                  Event streams (JSONL)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#737373]" />
                  Large artifacts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#737373]" />
                  Intermediate state
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Event Streaming */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            EVENT PERSISTENCE
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Run events are append-only and stored as JSONL for efficient streaming 
            and replay.
          </p>
          
          <CodeBlock
            filename="events.jsonl"
            language="json"
            code={`{"type":"run_started","timestamp":"2024-01-15T10:30:00Z","runId":"run_abc"}
{"type":"tool_called","timestamp":"2024-01-15T10:30:05Z","tool":"nmap","args":{...}}
{"type":"tool_completed","timestamp":"2024-01-15T10:30:45Z","tool":"nmap","result":{...}}
{"type":"evidence_added","timestamp":"2024-01-15T10:30:46Z","evidence":{...}}
{"type":"checkpoint_reached","timestamp":"2024-01-15T10:30:50Z","verdict":"continue"}
{"type":"run_completed","timestamp":"2024-01-15T10:31:00Z","status":"success"}`}
          />
        </section>

        {/* Artifact Storage */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ARTIFACT STORAGE
          </h2>
          
          <div className="border border-[#dc2626] bg-[#111111] p-4">
            <p className="text-xs text-[#e5e5e5] leading-relaxed">
              <span className="text-[#dc2626] font-medium">CONTENT-ADDRESSED:</span> Artifacts 
              are stored by content hash, enabling deduplication and integrity verification 
              across sessions.
            </p>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/control-plane/scheduling"
              className="group flex items-center gap-2 p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Assignment Planning
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/workers"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT SECTION
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Workers
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  )
}
