import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function EvidenceModelPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            ARCHITECTURE / EVIDENCE MODEL
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            EVIDENCE & REPORTING
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot&apos;s most important output is not the raw model text. It is the reduced 
            evidence and structured reports derived from tool execution results.
          </p>
        </div>

        {/* Evidence Flow Diagram */}
        <div className="border border-[#262626] bg-[#0d0d0d]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] bg-[#111111]">
            <span className="text-xs text-[#a3a3a3] tracking-wide">evidence pipeline</span>
            <span className="text-[10px] tracking-wider text-[#737373]">DATA FLOW</span>
          </div>
          <div className="p-6 font-mono">
            <pre className="text-xs leading-loose text-[#a3a3a3] overflow-x-auto">
{`┌─────────────────┐
│  Tool Execution │
│  (nmap, nikto,  │
│   nuclei, etc.) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  okOut/errOut   │  ◄── Normalize to JSON
│  Output Wrapper │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Evidence       │  ◄── Parse & categorize
│  Reducer        │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Assets    │    │  Findings   │    │  Tool       │
│             │    │             │    │  Evidence   │
└─────────────┘    └─────────────┘    └─────────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Session State  │  ◄── Accumulated
                  │  (reduced_state)│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    Reports      │
                  └─────────────────┘`}
            </pre>
          </div>
          <div className="h-0.5 bg-[#dc2626]" />
        </div>

        {/* Reduced Evidence State */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            REDUCED EVIDENCE STATE
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            lib/reporting.ts defines a normalized evidence model. Tool responses are parsed 
            and reduced incrementally during execution.
          </p>
          
          <CodeBlock
            filename="lib/reporting.ts"
            language="typescript"
            code={`interface ReducedEvidenceState {
  // Discovered hosts, services, endpoints
  assets: Asset[]
  
  // Security findings with severity
  findings: Finding[]
  
  // Raw tool execution results
  tool_evidence: ToolEvidence[]
  
  // Recommendations to halt/pause
  stop_recommendations: StopRecommendation[]
  
  // Hints for summary generation
  summary_hints: string[]
}

interface Asset {
  type: 'host' | 'service' | 'endpoint' | 'certificate'
  identifier: string
  metadata: Record<string, unknown>
  discovered_by: string  // tool name
  discovered_at: string  // ISO timestamp
}

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  evidence: string[]
  remediation?: string
}`}
          />
        </section>

        {/* Report Structure */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            REPORT STRUCTURE
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Per-run and per-session reports are generated from reduced evidence. Run reports 
            contain comprehensive execution details.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-4">RUN REPORT</h3>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Narrative summary/output
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Worker metadata
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Assignments executed
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Assessment gates
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Preflight state
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Recon deliverables
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Validation candidates
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Evidence graph
                </li>
              </ul>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-4">SESSION REPORT</h3>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Aggregated evidence across runs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  All discovered assets
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  All findings by severity
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Timeline of activities
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Worker participation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Routing decisions
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Assessment Gates */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ASSESSMENT GATES
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            The system derives whether a run is complete based on evidence coverage. This feeds 
            the Supervisor checkpoint and can prevent premature run completion.
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-[#22c55e] bg-[#111111] p-4">
              <code className="text-xs text-[#22c55e] font-mono">fulfilled</code>
              <p className="text-xs text-[#737373] mt-2">
                Minimum evidence coverage met. Run can complete.
              </p>
            </div>
            <div className="border border-[#eab308] bg-[#111111] p-4">
              <code className="text-xs text-[#eab308] font-mono">partial</code>
              <p className="text-xs text-[#737373] mt-2">
                Some evidence collected. May need follow-up.
              </p>
            </div>
            <div className="border border-[#dc2626] bg-[#111111] p-4">
              <code className="text-xs text-[#dc2626] font-mono">invalid</code>
              <p className="text-xs text-[#737373] mt-2">
                Insufficient evidence. Run should not complete.
              </p>
            </div>
          </div>
        </section>

        {/* Event Stream */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            RUN EVENT STREAM
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Run events are append-only records persisted as JSONL and optionally mirrored to 
            Postgres. They are also streamed over SSE from /v1/runs/:runId/events.
          </p>
          
          <CodeBlock
            filename="event streaming"
            language="typescript"
            code={`// SSE endpoint for real-time updates
GET /v1/runs/:runId/events

// Event types streamed
interface RunEvent {
  type: 
    | 'run_started'
    | 'tool_called'
    | 'tool_completed'
    | 'evidence_added'
    | 'assignment_started'
    | 'assignment_completed'
    | 'checkpoint_reached'
    | 'run_completed'
  
  timestamp: string
  data: Record<string, unknown>
}

// Used for:
// - Frontend real-time updates
// - Telegram bot updates
// - Timeline generation`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/architecture/system-design"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div className="text-right">
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Agent Runtime
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/architecture/security"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Safety Model
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
