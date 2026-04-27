import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function AssignmentPlanningPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            CONTROL PLANE / ASSIGNMENT PLANNING
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            ASSIGNMENT PLANNING
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Assignments are the unit of work in Patriot. Primary assignments are created 
            at run creation; lazy follow-up assignments appear after evidence suggests them.
          </p>
        </div>

        {/* Assignment Types */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ASSIGNMENT TYPES
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#dc2626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">remote_recon</code>
              <p className="text-xs text-[#737373] mt-3 leading-relaxed">
                Full reconnaissance against external targets using cloud Kali workers 
                with complete tool availability.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">local_recon</code>
              <p className="text-xs text-[#737373] mt-3 leading-relaxed">
                Local network discovery and scanning using field sensors or 
                on-premise workers.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">device_enrichment</code>
              <p className="text-xs text-[#737373] mt-3 leading-relaxed">
                Deep-dive on discovered devices. Service fingerprinting, 
                vulnerability assessment, certificate analysis.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">service_validation</code>
              <p className="text-xs text-[#737373] mt-3 leading-relaxed">
                Verify findings from other assignments. Confirm vulnerabilities, 
                validate access, test exploitation paths.
              </p>
            </div>
          </div>
        </section>

        {/* Assignment Lifecycle */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ASSIGNMENT LIFECYCLE
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] p-6">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="px-3 py-2 border border-[#262626] text-[#a3a3a3]">
                PLANNED
              </div>
              <span className="text-[#dc2626]">→</span>
              <div className="px-3 py-2 border border-[#262626] text-[#a3a3a3]">
                ASSIGNED
              </div>
              <span className="text-[#dc2626]">→</span>
              <div className="px-3 py-2 border border-[#dc2626] text-[#e5e5e5]">
                EXECUTING
              </div>
              <span className="text-[#dc2626]">→</span>
              <div className="px-3 py-2 border border-green-600 text-green-500">
                COMPLETED
              </div>
            </div>
          </div>
        </section>

        {/* Primary vs Follow-up */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            PRIMARY VS FOLLOW-UP
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-2 border-[#dc2626] pl-4">
              <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-2">
                PRIMARY ASSIGNMENTS
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Created at run creation based on prompt analysis. Represents the 
                initial work scope requested by the user.
              </p>
            </div>

            <div className="border-l-2 border-[#262626] pl-4">
              <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-2">
                LAZY FOLLOW-UP ASSIGNMENTS
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Generated during execution as evidence accumulates. When recon 
                discovers new targets or services, follow-up assignments are 
                automatically planned for enrichment or validation.
              </p>
            </div>
          </div>
        </section>

        {/* Assignment Planning Code */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            PLANNING IMPLEMENTATION
          </h2>
          
          <CodeBlock
            filename="lib/controlplane/service.ts"
            language="typescript"
            code={`// Assignment planning on run creation
async planAssignments(runContext: RunContext): Promise<Assignment[]> {
  const assignments: Assignment[] = []
  
  // Primary assignment based on routing intent
  const primaryAssignment = {
    id: generateId(),
    type: this.deriveAssignmentType(runContext),
    status: 'planned',
    workerId: runContext.selectedWorker?.id,
    targets: runContext.extractedTargets,
    tools: this.selectToolsForAssignment(runContext),
  }
  assignments.push(primaryAssignment)
  
  // Pre-planned follow-ups if scope suggests them
  if (runContext.scopeIncludesEnrichment) {
    assignments.push({
      id: generateId(),
      type: 'device_enrichment',
      status: 'pending_evidence',
      dependsOn: primaryAssignment.id,
    })
  }
  
  return assignments
}

// Lazy follow-up during execution
onEvidenceAdded(evidence: Evidence) {
  if (evidence.suggestsFollowUp) {
    this.planFollowUpAssignment(evidence)
  }
}`}
          />
        </section>

        {/* Field Sensor Jobs */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            FIELD SENSOR JOBS
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Field sensors use a pull-based job model. Jobs are queued by the control 
            plane and claimed by sensors via polling.
          </p>
          
          <div className="border border-[#262626] bg-[#111111] p-6">
            <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-4">JOB QUEUE FLOW</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="text-[#dc2626] font-mono shrink-0">1</span>
                <span className="text-[#a3a3a3]">Control plane queues job for field sensor capability</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#dc2626] font-mono shrink-0">2</span>
                <span className="text-[#a3a3a3]">Sensor polls <code className="text-[#e5e5e5]">GET /v1/field-sensors/jobs/claim</code></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#dc2626] font-mono shrink-0">3</span>
                <span className="text-[#a3a3a3]">Sensor executes job and returns results</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#dc2626] font-mono shrink-0">4</span>
                <span className="text-[#a3a3a3]">Control plane incorporates evidence into run state</span>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/control-plane/orchestration"
              className="group flex items-center gap-2 p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Routing & Capabilities
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/control-plane/state"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
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
