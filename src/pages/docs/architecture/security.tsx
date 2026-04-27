import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function SafetyModelPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            ARCHITECTURE / SAFETY MODEL
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            SAFETY & PERMISSIONS
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Safety is not a single flag. Patriot combines mode, tier, safety toggles, tool 
            policy metadata, and exact-call approval tokens for impactful execute-tier tools.
          </p>
        </div>

        {/* Safety Dimensions */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            SAFETY DIMENSIONS
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-4">MODE</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <code className="text-xs text-[#e5e5e5] font-mono shrink-0 w-20">plan</code>
                  <span className="text-xs text-[#737373]">Read-only analysis, no tool execution</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="text-xs text-[#e5e5e5] font-mono shrink-0 w-20">execute</code>
                  <span className="text-xs text-[#737373]">Full tool execution allowed</span>
                </div>
              </div>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-4">TIER</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <code className="text-xs text-[#e5e5e5] font-mono shrink-0 w-20">recon</code>
                  <span className="text-xs text-[#737373]">Passive reconnaissance only</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="text-xs text-[#e5e5e5] font-mono shrink-0 w-20">simulate</code>
                  <span className="text-xs text-[#737373]">Non-destructive testing</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="text-xs text-[#e5e5e5] font-mono shrink-0 w-20">execute</code>
                  <span className="text-xs text-[#737373]">Full offensive operations</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#262626] bg-[#111111] p-6">
            <h3 className="text-xs tracking-wider text-[#dc2626] mb-4">ADDITIONAL CONTROLS</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <code className="text-xs text-[#e5e5e5] font-mono shrink-0">safetyEnabled</code>
                <span className="text-xs text-[#737373]">Boolean toggle for additional restrictions</span>
              </div>
              <div className="flex items-start gap-3">
                <code className="text-xs text-[#e5e5e5] font-mono shrink-0">toolPolicyMetadata</code>
                <span className="text-xs text-[#737373]">Per-tool restrictions and requirements</span>
              </div>
              <div className="flex items-start gap-3">
                <code className="text-xs text-[#e5e5e5] font-mono shrink-0">approvalTokens</code>
                <span className="text-xs text-[#737373]">Exact-call approvals for impactful tools</span>
              </div>
            </div>
          </div>
        </section>

        {/* Enforcement */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            POLICY ENFORCEMENT
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            agents/permissions.ts and agents/policy.ts enforce safety constraints at runtime.
          </p>
          
          <CodeBlock
            filename="agents/policy.ts"
            language="typescript"
            code={`// Policy enforcement checks
interface PolicyEnforcement {
  // Deny unknown or unregistered tools
  unknownToolDenial: boolean
  
  // Limit tools per turn
  perTurnToolBudget: number
  
  // Restrict tool access in plan mode
  planModeRestrictions: string[]
  
  // Gate tools by tier level
  tierGating: Record<string, ToolTier>
  
  // Additional safety-on restrictions
  safetyOnRestrictions: string[]
  
  // Require explicit approval for impactful tools
  exactCallApprovals: Map<string, ApprovalToken>
  
  // Quarantine after repeated violations
  quarantineThreshold: number
}

// Remote public recon also blocks
// worker-local introspection tools`}
          />

          <div className="border border-[#dc2626] bg-[#111111] p-4">
            <p className="text-xs text-[#e5e5e5] leading-relaxed">
              <span className="text-[#dc2626] font-medium">QUARANTINE:</span> After repeated policy 
              violations, a session or worker can be quarantined, blocking further tool execution 
              until manually reviewed.
            </p>
          </div>
        </section>

        {/* Redteam Surface */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            REDTEAM SURFACE
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            A separate redteam tool layer exists in agents/tools/redteam.ts but is heavily 
            gated. It only becomes reachable under specific conditions.
          </p>
          
          <div className="border border-[#262626] bg-[#0d0d0d] p-6">
            <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-4">ACTIVATION REQUIREMENTS</h3>
            <ul className="space-y-2 text-xs text-[#a3a3a3]">
              <li className="flex items-center gap-3">
                <span className="w-4 h-4 border border-[#dc2626] flex items-center justify-center text-[8px] text-[#dc2626]">1</span>
                <span>Mode must be <code className="text-[#e5e5e5]">execute</code></span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-4 h-4 border border-[#dc2626] flex items-center justify-center text-[8px] text-[#dc2626]">2</span>
                <span>Tier must be <code className="text-[#e5e5e5]">execute</code></span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-4 h-4 border border-[#dc2626] flex items-center justify-center text-[8px] text-[#dc2626]">3</span>
                <span>Safety must be <code className="text-[#e5e5e5]">off</code></span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-4 h-4 border border-[#dc2626] flex items-center justify-center text-[8px] text-[#dc2626]">4</span>
                <span>Redteam must be <code className="text-[#e5e5e5]">explicitly enabled</code></span>
              </li>
            </ul>
          </div>
        </section>

        {/* Tool Policy Matrix */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            TOOL POLICY MATRIX
          </h2>
          
          <div className="border border-[#262626] overflow-hidden overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="bg-[#111111]">
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">TOOL TYPE</th>
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">RECON</th>
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">SIMULATE</th>
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">EXECUTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                <tr className="bg-[#0d0d0d]">
                  <td className="p-3 text-[#a3a3a3] font-mono">composite_recon</td>
                  <td className="p-3"><span className="text-[#22c55e]">ALLOWED</span></td>
                  <td className="p-3"><span className="text-[#22c55e]">ALLOWED</span></td>
                  <td className="p-3"><span className="text-[#22c55e]">ALLOWED</span></td>
                </tr>
                <tr className="bg-[#0d0d0d]">
                  <td className="p-3 text-[#a3a3a3] font-mono">raw_recon</td>
                  <td className="p-3"><span className="text-[#22c55e]">ALLOWED</span></td>
                  <td className="p-3"><span className="text-[#22c55e]">ALLOWED</span></td>
                  <td className="p-3"><span className="text-[#22c55e]">ALLOWED</span></td>
                </tr>
                <tr className="bg-[#0d0d0d]">
                  <td className="p-3 text-[#a3a3a3] font-mono">local_introspection</td>
                  <td className="p-3"><span className="text-[#dc2626]">BLOCKED</span></td>
                  <td className="p-3"><span className="text-[#eab308]">LIMITED</span></td>
                  <td className="p-3"><span className="text-[#22c55e]">ALLOWED</span></td>
                </tr>
                <tr className="bg-[#0d0d0d]">
                  <td className="p-3 text-[#a3a3a3] font-mono">exploitation</td>
                  <td className="p-3"><span className="text-[#dc2626]">BLOCKED</span></td>
                  <td className="p-3"><span className="text-[#dc2626]">BLOCKED</span></td>
                  <td className="p-3"><span className="text-[#eab308]">APPROVAL</span></td>
                </tr>
                <tr className="bg-[#0d0d0d]">
                  <td className="p-3 text-[#a3a3a3] font-mono">redteam</td>
                  <td className="p-3"><span className="text-[#dc2626]">BLOCKED</span></td>
                  <td className="p-3"><span className="text-[#dc2626]">BLOCKED</span></td>
                  <td className="p-3"><span className="text-[#dc2626]">GATED*</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#737373]">
            * Requires explicit redteam flag and safety off
          </p>
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/architecture/data-flow"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div className="text-right">
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Evidence Model
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/control-plane"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT SECTION
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Control Plane
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
