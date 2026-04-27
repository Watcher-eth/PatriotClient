import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function RoutingPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            CONTROL PLANE / ROUTING
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            ROUTING & CAPABILITIES
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot routes runs to workers based on capability matching, routing intent, 
            and worker availability—not just explicit user flags.
          </p>
        </div>

        {/* Capability Model */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            CAPABILITY MODEL
          </h2>
          
          <CodeBlock
            filename="lib/controlplane/types.ts"
            language="typescript"
            code={`// Standard capabilities declared by workers
type Capability =
  | 'nmap'
  | 'nikto'
  | 'nuclei'
  | 'gobuster'
  | 'local_network_scan'
  | 'arp_scan'
  | 'bluetooth_scan'
  | 'wireless_monitor'
  | 'wireless_injection'
  | 'dns_resolution'
  | 'http_client'
  | 'ssh_client'
  | 'shell_execution'

// Derived from prompt content
interface RoutingConstraints {
  requiresKali: boolean
  requiresLocalPresence: boolean
  requiresWirelessMonitor: boolean
  requiresWirelessInjection: boolean
}`}
          />
        </section>

        {/* Worker Selection */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            WORKER SELECTION PRIORITY
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] p-6">
            <ol className="space-y-3 text-xs">
              <li className="flex gap-4 items-start">
                <span className="text-[#dc2626] font-mono shrink-0 w-6">01</span>
                <span className="text-[#a3a3a3]">
                  <span className="text-[#e5e5e5]">Explicitly requested worker</span> — if compatible with required capabilities
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-[#dc2626] font-mono shrink-0 w-6">02</span>
                <span className="text-[#a3a3a3]">
                  <span className="text-[#e5e5e5]">Claimed compatible worker</span> — currently assigned to session
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-[#dc2626] font-mono shrink-0 w-6">03</span>
                <span className="text-[#a3a3a3]">
                  <span className="text-[#e5e5e5]">Preferred local follow-up worker</span> — for local continuity
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-[#dc2626] font-mono shrink-0 w-6">04</span>
                <span className="text-[#a3a3a3]">
                  <span className="text-[#e5e5e5]">Compatible field sensor</span> — for local-presence requests
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-[#dc2626] font-mono shrink-0 w-6">05</span>
                <span className="text-[#a3a3a3]">
                  <span className="text-[#e5e5e5]">Compatible cloud Kali worker</span> — for remote recon
                </span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-[#dc2626] font-mono shrink-0 w-6">06</span>
                <span className="text-[#a3a3a3]">
                  <span className="text-[#e5e5e5]">Best compatible fallback</span> — any worker meeting requirements
                </span>
              </li>
            </ol>
          </div>
        </section>

        {/* Routing Intent */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ROUTING INTENT TYPES
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#262626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">local_fresh</code>
              <p className="text-xs text-[#737373] mt-2">
                New local-presence request. Prefers field sensors or on-premise workers.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">local_followup</code>
              <p className="text-xs text-[#737373] mt-2">
                Continuing local evidence. Prefers same worker for context continuity.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">remote_fresh</code>
              <p className="text-xs text-[#737373] mt-2">
                New remote/cloud request. Prefers Kali workers with full tooling.
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-6">
              <code className="text-xs text-[#dc2626] font-mono">remote_followup</code>
              <p className="text-xs text-[#737373] mt-2">
                Continuing remote evidence. May select different worker if needed.
              </p>
            </div>
          </div>
        </section>

        {/* Capability Derivation */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            CAPABILITY DERIVATION
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Required capabilities are derived from prompt content, not just explicit declarations.
          </p>
          
          <CodeBlock
            filename="lib/controlplane/routing.ts"
            language="typescript"
            code={`// Example derivation rules
function deriveConstraints(prompt: string): RoutingConstraints {
  const lower = prompt.toLowerCase()
  
  return {
    // Kali required for full tool suite
    requiresKali: 
      lower.includes('nmap') ||
      lower.includes('nikto') ||
      lower.includes('nuclei'),
    
    // Local presence for nearby network
    requiresLocalPresence:
      lower.includes('local network') ||
      lower.includes('192.168.') ||
      lower.includes('10.0.') ||
      lower.includes('bluetooth'),
    
    // Wireless capabilities
    requiresWirelessMonitor:
      lower.includes('wifi') ||
      lower.includes('wireless scan'),
    
    requiresWirelessInjection:
      lower.includes('deauth') ||
      lower.includes('injection attack'),
  }
}`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/control-plane"
              className="group flex items-center gap-2 p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Overview
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/control-plane/scheduling"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Assignment Planning
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
