import { DocsLayout } from '../../../components/docs/docs-layout'
import { CodeBlock } from '../../../components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function ReconToolsPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            WORKERS / RECON TOOLS
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            RECON TOOLS
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot tools are defined in agents/tools/ and wrapped as MCP tools for the 
            Claude Agent SDK. Composite tools combine multiple raw tools intelligently.
          </p>
        </div>

        {/* Tool Categories */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            TOOL CATEGORIES
          </h2>
          
          <div className="space-y-4">
            <div className="border border-[#dc2626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">
                COMPOSITE RECON TOOLS
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                High-level tools that orchestrate multiple raw tools based on context.
                Preferred by the Recon subagent.
              </p>
              <div className="flex flex-wrap gap-2">
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">full_domain_recon</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">service_enumeration</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">vuln_assessment</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">web_discovery</code>
              </div>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">
                RAW RECON TOOLS
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                Direct wrappers around standard security tools. Used when specific 
                tool behavior is needed.
              </p>
              <div className="flex flex-wrap gap-2">
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">nmap</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">nikto</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">nuclei</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">gobuster</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">dig</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">whois</code>
              </div>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">
                LOCAL DISCOVERY TOOLS
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                Tools for local network and nearby device discovery. Run on field 
                sensors or local workers.
              </p>
              <div className="flex flex-wrap gap-2">
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">arp_scan</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">bluetooth_scan</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">wifi_scan</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">mdns_discovery</code>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Definition */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            TOOL DEFINITION PATTERN
          </h2>
          
          <CodeBlock
            filename="agents/tools/recon.ts"
            language="typescript"
            code={`// Raw tool wrapper
export const nmapTool = defineTool({
  name: 'nmap',
  description: 'Network port scanner and service detection',
  
  parameters: z.object({
    target: z.string().describe('Target IP, hostname, or CIDR'),
    ports: z.string().optional().describe('Port specification'),
    scanType: z.enum(['quick', 'full', 'stealth']).default('quick'),
    serviceDetection: z.boolean().default(true),
  }),
  
  // Execution mode determines where tool runs
  executionMode: 'kali',
  
  // Tier gating
  tier: 'recon',
  
  async execute({ target, ports, scanType, serviceDetection }, ctx) {
    const args = buildNmapArgs({ target, ports, scanType, serviceDetection })
    const { stdout, stderr } = await ctx.exec('nmap', args)
    
    return okOut({
      raw: stdout,
      parsed: parseNmapOutput(stdout),
      evidenceType: 'port_scan',
    })
  },
})`}
          />
        </section>

        {/* Composite Tool Example */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            COMPOSITE TOOL EXAMPLE
          </h2>
          
          <CodeBlock
            filename="agents/tools/composite.ts"
            language="typescript"
            code={`// Composite tool that orchestrates multiple raw tools
export const fullDomainReconTool = defineTool({
  name: 'full_domain_recon',
  description: 'Complete reconnaissance of a domain',
  
  parameters: z.object({
    domain: z.string(),
    depth: z.enum(['shallow', 'deep']).default('shallow'),
  }),
  
  async execute({ domain, depth }, ctx) {
    const results = {
      dns: await ctx.callTool('dig', { domain }),
      whois: await ctx.callTool('whois', { domain }),
      subdomains: await ctx.callTool('subfinder', { domain }),
    }
    
    if (depth === 'deep') {
      results.ports = await ctx.callTool('nmap', { 
        target: domain, 
        scanType: 'full' 
      })
      results.vulns = await ctx.callTool('nuclei', { 
        target: domain 
      })
    }
    
    return okOut({
      domain,
      depth,
      results,
      evidenceType: 'domain_recon',
    })
  },
})`}
          />
        </section>

        {/* Output Wrapper */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            OUTPUT WRAPPER
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Tools return results wrapped in <code className="text-[#e5e5e5]">okOut</code> or <code className="text-[#e5e5e5]">errOut</code> 
            for consistent evidence reduction.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#22c55e] bg-[#111111] p-4">
              <code className="text-xs text-[#22c55e] font-mono">okOut(data)</code>
              <p className="text-xs text-[#737373] mt-2">
                Success. Data is parsed and added to evidence.
              </p>
            </div>
            <div className="border border-[#dc2626] bg-[#111111] p-4">
              <code className="text-xs text-[#dc2626] font-mono">errOut(error)</code>
              <p className="text-xs text-[#737373] mt-2">
                Failure. Error is logged, may trigger retry.
              </p>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/workers/execution"
              className="group flex items-center gap-2 p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Field Sensors
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/workers/scaling"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Capability Model
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
