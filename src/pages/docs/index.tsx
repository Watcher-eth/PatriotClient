import Link from 'next/link'
import { DocsLayout } from '@/components/docs/docs-layout'
import { ArrowRight, Layers, Cpu, Terminal, Network } from 'lucide-react'

const sections = [
  {
    icon: Layers,
    title: 'ARCHITECTURE',
    description: 'Agent runtime, evidence reduction, safety model, and session management.',
    href: '/docs/architecture',
    subsections: ['Overview', 'Agent Runtime', 'Evidence Model', 'Safety Model'],
  },
  {
    icon: Cpu,
    title: 'CONTROL PLANE',
    description: 'ControlPlaneService, routing, persistence, and event streaming.',
    href: '/docs/control-plane',
    subsections: ['Overview', 'Routing', 'Persistence', 'Events'],
  },
  {
    icon: Terminal,
    title: 'WORKERS',
    description: 'Kali workers, field sensors, capability model, and health states.',
    href: '/docs/workers',
    subsections: ['Overview', 'Worker Types', 'Field Sensors', 'Capabilities'],
  },
  {
    icon: Network,
    title: 'INTERFACES',
    description: 'REST API, Telegram bot, desktop client, and mobile app.',
    href: '/docs/interfaces',
    subsections: ['Overview', 'REST API', 'Telegram', 'Clients'],
  },
]

const coreFiles = [
  { path: 'patriot/lib/controlplane/service.ts', desc: 'Main domain model' },
  { path: 'patriot/lib/controlplane/server.ts', desc: 'Express API server' },
  { path: 'patriot/agents/orchestrator.ts', desc: 'LLM agent runtime' },
  { path: 'patriot/agents/tools/recon.ts', desc: 'Raw recon tools' },
  { path: 'patriot/agents/tools/compositeRecon.ts', desc: 'Composite tool layer' },
  { path: 'patriot/workers/fieldSensor.ts', desc: 'Field sensor worker' },
]

export default function DocsIndexPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            DOCUMENTATION
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            GETTING STARTED
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot is a capability-routed offensive security orchestration system. 
            The control plane receives prompts, selects appropriate workers or field sensors, 
            runs an LLM-driven recon agent with strict tool policy gates, and publishes 
            persistent reports.
          </p>
        </div>

        {/* System in One Sentence */}
        <div className="border border-[#dc2626] bg-[#111111] p-6">
          <h2 className="text-xs tracking-wider text-[#dc2626] mb-3">
            SYSTEM OVERVIEW
          </h2>
          <p className="text-sm text-[#e5e5e5] leading-relaxed font-mono">
            A Bun/TypeScript control plane receives prompts, selects an appropriate worker 
            or field sensor, runs an LLM-driven recon agent with strict tool policy gates, 
            reduces tool output into structured evidence, and publishes persistent reports, 
            timelines, and artifacts to clients.
          </p>
        </div>

        {/* Two Execution Families */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#262626] bg-[#0d0d0d] p-6">
            <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-3">
              REMOTE EXECUTION
            </h3>
            <p className="text-xs text-[#737373] leading-relaxed mb-4">
              Cloud-based execution on Kali workers for full remote reconnaissance 
              capabilities including nmap, nikto, nuclei, and other security tools.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#dc2626]">
              <span className="w-1.5 h-1.5 bg-[#dc2626]" />
              KALI_CLOUD / KALI_FIELD
            </div>
          </div>
          
          <div className="border border-[#262626] bg-[#0d0d0d] p-6">
            <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-3">
              LOCAL EXECUTION
            </h3>
            <p className="text-xs text-[#737373] leading-relaxed mb-4">
              Desktop and mobile field sensors for local/nearby execution including 
              LAN discovery, Bluetooth scanning, and gateway fingerprinting.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#dc2626]">
              <span className="w-1.5 h-1.5 bg-[#dc2626]" />
              FIELD_SENSOR / MOBILE
            </div>
          </div>
        </div>

        {/* Core Source Files */}
        <div className="border border-[#262626] bg-[#111111] p-6">
          <h2 className="text-xs tracking-wider text-[#e5e5e5] mb-4">
            PRIMARY SOURCE FILES
          </h2>
          <div className="space-y-2 font-mono">
            {coreFiles.map((file) => (
              <div key={file.path} className="flex items-start gap-4 text-xs">
                <code className="text-[#dc2626] shrink-0">{file.path}</code>
                <span className="text-[#737373]">{file.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group border border-[#262626] bg-[#0d0d0d] p-6 hover:border-[#dc2626] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 border border-[#262626] group-hover:border-[#dc2626] transition-colors">
                  <section.icon className="w-4 h-4 text-[#dc2626]" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] transition-colors" />
              </div>
              
              <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-2">
                {section.title}
              </h3>
              <p className="text-xs text-[#737373] mb-4 leading-relaxed">
                {section.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {section.subsections.map((sub) => (
                  <span
                    key={sub}
                    className="text-[10px] tracking-wide text-[#737373] px-2 py-1 border border-[#262626]"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="border-t border-[#262626] pt-8">
          <h2 className="text-xs tracking-wider text-[#e5e5e5] mb-4">
            QUICK LINKS
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/docs/interfaces/rest-api"
              className="text-xs tracking-wide text-[#dc2626] hover:underline"
            >
              API Reference
            </Link>
            <Link
              href="/docs/architecture/security"
              className="text-xs tracking-wide text-[#dc2626] hover:underline"
            >
              Safety Model
            </Link>
            <Link
              href="/docs/workers/execution"
              className="text-xs tracking-wide text-[#dc2626] hover:underline"
            >
              Field Sensors
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
