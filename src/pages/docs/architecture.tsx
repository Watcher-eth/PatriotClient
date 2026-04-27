import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ArchitecturePage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            ARCHITECTURE / OVERVIEW
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            SYSTEM ARCHITECTURE
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot is a capability-routed offensive security orchestration system: a Bun/TypeScript 
            control plane receives prompts, selects an appropriate worker or field sensor, runs an 
            LLM-driven recon agent with strict tool policy gates, reduces tool output into structured 
            evidence, and publishes persistent reports, timelines, and artifacts to clients.
          </p>
        </div>

        {/* High-Level Architecture Diagram */}
        <div className="border border-[#262626] bg-[#0d0d0d]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] bg-[#111111]">
            <span className="text-xs text-[#a3a3a3] tracking-wide">architecture</span>
            <span className="text-[10px] tracking-wider text-[#737373]">HIGH-LEVEL</span>
          </div>
          <div className="p-6 font-mono">
            <pre className="text-xs leading-loose text-[#a3a3a3] overflow-x-auto">
{`Operator UI / Telegram / API
        │
        ▼
┌─────────────────────────────────┐
│   Control Plane API (Express)   │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│     ControlPlaneService         │
│  ├─ session management          │
│  ├─ worker registry             │
│  ├─ routing + capability match  │
│  ├─ run lifecycle               │
│  ├─ field-sensor enrollment     │
│  └─ evidence reduction          │
└─────────────────────────────────┘
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
┌───────────────────┐    ┌───────────────────┐
│   Agent Runtime   │    │  Field Sensor     │
│  (Claude SDK +    │    │  Job Queue        │
│   Patriot Tools)  │    │                   │
└───────────────────┘    └───────────────────┘
        │                              │
        ▼                              ▼
┌───────────────────────────────────────────┐
│    Event Stream / Reports / Artifacts     │
└───────────────────────────────────────────┘`}
            </pre>
          </div>
          <div className="h-0.5 bg-[#dc2626]" />
        </div>

        {/* Execution Families */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            EXECUTION FAMILIES
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            The key architectural decision is that Patriot does not treat all prompts the same. 
            It derives whether a request is local or remote, computes required capabilities, and 
            routes to a compatible execution surface.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">
                REMOTE / CLOUD EXECUTION
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                Full reconnaissance capabilities on Kali workers. Supports nmap, nikto, nuclei, 
                gobuster, feroxbuster, and other security tools. Used for remote/global recon.
              </p>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  kali_cloud workers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  kali_field workers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  kali_customer_edge workers
                </li>
              </ul>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">
                LOCAL / NEARBY EXECUTION
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                Desktop and mobile field sensors for local network context, Bluetooth 
                scanning, gateway fingerprinting, and nearby device discovery.
              </p>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Desktop Electron sensor
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Mobile iOS sensor
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  Pull-based job execution
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Primary Runtime Surfaces */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            PRIMARY RUNTIME SURFACES
          </h2>
          
          <div className="space-y-4">
            <div className="border border-[#262626] bg-[#0d0d0d] p-6">
              <div className="flex items-center gap-3 mb-3">
                <code className="text-xs text-[#dc2626] font-mono">patriot/</code>
                <span className="text-[10px] tracking-widest text-[#737373]">CORE SYSTEM</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                The main runtime containing the control plane, agents, workers, and tools.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#737373] font-mono">
                <span>api.ts</span>
                <span className="text-[#525252]">HTTP server start</span>
                <span>lib/controlplane/*</span>
                <span className="text-[#525252]">Control plane logic</span>
                <span>agents/*</span>
                <span className="text-[#525252]">LLM orchestration</span>
                <span>workers/*</span>
                <span className="text-[#525252]">Worker scripts</span>
              </div>
            </div>

            <div className="border border-[#262626] bg-[#0d0d0d] p-6">
              <div className="flex items-center gap-3 mb-3">
                <code className="text-xs text-[#dc2626] font-mono">patriotclient/</code>
                <span className="text-[10px] tracking-widest text-[#737373]">DESKTOP CLIENT</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Next.js pages-router app for sessions, runs, and reports. Electron shell for 
                native desktop pairing and local field-sensor execution.
              </p>
            </div>

            <div className="border border-[#262626] bg-[#0d0d0d] p-6">
              <div className="flex items-center gap-3 mb-3">
                <code className="text-xs text-[#dc2626] font-mono">patriotexpo/</code>
                <span className="text-[10px] tracking-widest text-[#737373]">MOBILE CLIENT</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Expo iPhone-first mobile client with session UI, mobile field-sensor worker, 
                and limited native nearby/LAN probing capabilities.
              </p>
            </div>

            <div className="border border-[#262626] bg-[#0d0d0d] p-6">
              <div className="flex items-center gap-3 mb-3">
                <code className="text-xs text-[#dc2626] font-mono">patriotshared/</code>
                <span className="text-[10px] tracking-widest text-[#737373]">SHARED CONTRACT</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Shared types for runs, sessions, workers, reports, evidence. Client helpers 
                for control-plane API access. Contract layer for both desktop and mobile clients.
              </p>
            </div>
          </div>
        </section>

        {/* Main Design Choices */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            MAIN DESIGN CHOICES
          </h2>
          
          <div className="border border-[#262626] bg-[#111111] p-6">
            <ul className="space-y-3 text-xs text-[#a3a3a3]">
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">Capability-based worker routing</span> instead of a single execution target</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">Composite-first recon tools</span> instead of raw-tool-first prompting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">Tool-backed evidence</span> as the source of truth, not narrative text</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">Session-level evidence accumulation</span> across runs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">File-backed persistence</span> with optional Postgres mirroring</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">Pull-based field-sensor jobs</span> instead of push RPC</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">Safety gates</span> based on mode + tier + approvals + tool metadata</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5 shrink-0" />
                <span><span className="text-[#e5e5e5]">Lazy follow-up assignment planning</span> from evidence, not fixed workflow graphs</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Next Steps */}
        <section className="border-t border-[#262626] pt-8">
          <h2 className="text-xs tracking-wider text-[#e5e5e5] mb-4">
            CONTINUE READING
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/architecture/system-design"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Agent Runtime
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
            </Link>
            
            <Link
              href="/docs/architecture/data-flow"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  RELATED
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Evidence Model
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
