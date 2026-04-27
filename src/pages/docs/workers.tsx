import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function WorkersPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            WORKERS / OVERVIEW
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            WORKER MODEL
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot treats Kali as the hard requirement for full remote execution, but allows 
            local field sensors to contribute bounded nearby evidence and local network context.
          </p>
        </div>

        {/* Worker Types */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            WORKER TYPES
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-[#262626] bg-[#111111] p-4">
              <code className="text-xs text-[#dc2626] font-mono">kali_cloud</code>
              <p className="text-[10px] text-[#737373] mt-2">
                Remote cloud Kali workers
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-4">
              <code className="text-xs text-[#dc2626] font-mono">kali_field</code>
              <p className="text-[10px] text-[#737373] mt-2">
                On-premise Kali workers
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-4">
              <code className="text-xs text-[#dc2626] font-mono">kali_customer_edge</code>
              <p className="text-[10px] text-[#737373] mt-2">
                Customer-hosted Kali
              </p>
            </div>
            <div className="border border-[#262626] bg-[#111111] p-4">
              <code className="text-xs text-[#dc2626] font-mono">field_sensor</code>
              <p className="text-[10px] text-[#737373] mt-2">
                Desktop/mobile sensors
              </p>
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            SUPPORTED PLATFORMS
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {['kali', 'macos', 'windows', 'linux', 'ios', 'android', 'embedded'].map((platform) => (
              <span key={platform} className="text-xs px-3 py-1.5 border border-[#262626] bg-[#0d0d0d] text-[#a3a3a3] font-mono">
                {platform}
              </span>
            ))}
          </div>
        </section>

        {/* Worker Health Model */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            HEALTH MODEL
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Workers expose declared capabilities and adapter health is derived, not just declared.
          </p>
          
          <CodeBlock
            filename="lib/controlplane/types.ts"
            language="typescript"
            code={`interface WorkerProfile {
  // Worker identification
  id: string
  type: WorkerType
  platform: Platform
  
  // Capability declarations
  capabilities: string[]
  capabilityInventory: CapabilityInventory
  toolInventory: ToolInventory
  permissionInventory: PermissionInventory
  
  // Adapter metadata
  adapterMetadata: AdapterMetadata
}

// Derived health states
type WorkerHealth = 
  | 'healthy'   // All systems operational
  | 'degraded'  // Some capabilities limited
  | 'blocked'   // Cannot execute tasks`}
          />
        </section>

        {/* Worker Components */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            EXECUTION SURFACES
          </h2>
          
          <div className="space-y-4">
            <Link 
              href="/docs/workers/execution"
              className="group block border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs tracking-wider text-[#dc2626] mb-2">
                    FIELD SENSORS
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    Desktop (Electron) and mobile (iOS) field sensors for local network 
                    discovery, Bluetooth scanning, and nearby evidence collection.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
              </div>
            </Link>

            <Link 
              href="/docs/workers/tasks"
              className="group block border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs tracking-wider text-[#dc2626] mb-2">
                    RECON TOOLS
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    Raw and composite recon tools including nmap, nikto, nuclei, 
                    gobuster, and local discovery probes.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
              </div>
            </Link>

            <Link 
              href="/docs/workers/scaling"
              className="group block border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs tracking-wider text-[#dc2626] mb-2">
                    CAPABILITY MODEL
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    Mobile-first vs desktop capabilities, tool availability, and 
                    permission requirements for each platform.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
              </div>
            </Link>
          </div>
        </section>

        {/* Routing Model */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ROUTING MODEL
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] p-6">
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="text-[#dc2626] font-mono shrink-0">REMOTE</span>
                <span className="text-[#a3a3a3]">
                  Cloud/global recon prefers Kali workers with full tool availability
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#dc2626] font-mono shrink-0">LOCAL</span>
                <span className="text-[#a3a3a3]">
                  Local/LAN prompts prefer field sensors or non-cloud local workers
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#dc2626] font-mono shrink-0">HYBRID</span>
                <span className="text-[#a3a3a3]">
                  Capability availability, not just platform, determines routing
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <h2 className="text-xs tracking-wider text-[#e5e5e5] mb-4">
            CONTINUE READING
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/workers/execution"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Field Sensors
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
            </Link>
            
            <Link
              href="/docs/workers/tasks"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  RELATED
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Recon Tools
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
