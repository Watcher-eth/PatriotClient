import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ControlPlanePage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            CONTROL PLANE / OVERVIEW
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            CONTROL PLANE
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            The control plane is an Express app built in patriot/lib/controlplane/server.ts. 
            The real business logic lives in ControlPlaneService in patriot/lib/controlplane/service.ts.
          </p>
        </div>

        {/* What ControlPlaneService Owns */}
        <div className="border border-[#dc2626] bg-[#111111] p-6">
          <div className="text-[10px] tracking-widest text-[#dc2626] mb-4">
            ControlPlaneService OWNERSHIP
          </div>
          <p className="text-xs text-[#a3a3a3] mb-4">
            This file is effectively the main domain model of the Patriot system. It owns:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Worker lifecycle
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Session lifecycle
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Run creation/execution
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Routing intent
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Capability matching
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Active run tracking
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Assignment planning
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Field-sensor jobs
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Evidence reduction
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              Report generation
            </div>
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <span className="w-1 h-1 bg-[#dc2626]" />
              SSE events
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            API ENDPOINTS
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] overflow-hidden overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[#111111] border-b border-[#262626]">
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">ENDPOINT</th>
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">PURPOSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">POST /v1/workers/register</td>
                  <td className="p-3 text-[#a3a3a3]">Worker registration and heartbeat</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">POST /v1/field-sensors/bootstrap</td>
                  <td className="p-3 text-[#a3a3a3]">Field-sensor enrollment</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">GET /v1/field-sensors/jobs/claim</td>
                  <td className="p-3 text-[#a3a3a3]">Pull-based job execution</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">POST /v1/sessions</td>
                  <td className="p-3 text-[#a3a3a3]">Session creation</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">POST /v1/runs</td>
                  <td className="p-3 text-[#a3a3a3]">Run creation</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">GET /v1/runs/:runId/events</td>
                  <td className="p-3 text-[#a3a3a3]">SSE event streaming</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">GET /v1/runs/:runId/report</td>
                  <td className="p-3 text-[#a3a3a3]">Run report with evidence</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#dc2626] font-mono">POST /v1/telegram/webhook</td>
                  <td className="p-3 text-[#a3a3a3]">Telegram bot ingestion</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Components */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            SUBSYSTEMS
          </h2>
          
          <div className="space-y-4">
            <Link 
              href="/docs/control-plane/orchestration"
              className="group block border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs tracking-wider text-[#dc2626] mb-2">
                    ROUTING & CAPABILITY MATCHING
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    Derives routing intent (local vs remote), computes required capabilities, 
                    and selects compatible workers or field sensors.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
              </div>
            </Link>

            <Link 
              href="/docs/control-plane/scheduling"
              className="group block border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs tracking-wider text-[#dc2626] mb-2">
                    ASSIGNMENT PLANNING
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    Creates primary assignments at run creation and lazy follow-up 
                    assignments after evidence appears.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
              </div>
            </Link>

            <Link 
              href="/docs/control-plane/state"
              className="group block border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs tracking-wider text-[#dc2626] mb-2">
                    PERSISTENCE MODEL
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    File-backed store with optional Postgres mirroring. Stores sessions, 
                    runs, workers, artifacts, and events.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
              </div>
            </Link>
          </div>
        </section>

        {/* Routing Intent */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ROUTING INTENT
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            For each run, Patriot derives routing intent from prompt content and prior evidence, 
            not just explicit user flags.
          </p>
          
          <CodeBlock
            filename="lib/controlplane/service.ts"
            language="typescript"
            code={`// Routing intent types
type RoutingIntent = 
  | 'local_fresh'      // New local-presence request
  | 'local_followup'   // Continue local evidence
  | 'remote_fresh'     // New remote/cloud request  
  | 'remote_followup'  // Continue remote evidence

// Constraint flags derived from prompt
interface RoutingConstraints {
  requiresKali: boolean
  requiresLocalPresence: boolean
  requiresWirelessMonitor: boolean
  requiresWirelessInjection: boolean
}

// Worker selection preference order:
// 1. Explicitly requested worker (if compatible)
// 2. Claimed compatible worker
// 3. Preferred local follow-up worker
// 4. Compatible field sensor (for local)
// 5. Compatible cloud Kali worker (for remote)
// 6. Best compatible fallback`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <h2 className="text-xs tracking-wider text-[#e5e5e5] mb-4">
            CONTINUE READING
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/control-plane/orchestration"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Routing & Capabilities
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
            </Link>
            
            <Link
              href="/docs/control-plane/state"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  RELATED
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Persistence Model
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
