import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function AgentRuntimePage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            ARCHITECTURE / AGENT RUNTIME
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            AGENT RUNTIME
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            The LLM runtime is orchestrated in patriot/agents/orchestrator.ts using the 
            Claude Agent SDK with Patriot-specific system prompts, tool policies, and subagents.
          </p>
        </div>

        {/* Core Execution Pattern */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            CORE EXECUTION PATTERN
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] bg-[#111111]">
              <span className="text-xs text-[#a3a3a3] tracking-wide">execution flow</span>
              <span className="text-[10px] tracking-wider text-[#737373]">PER RUN</span>
            </div>
            <div className="p-6">
              <ol className="space-y-4 text-xs">
                <li className="flex gap-4">
                  <span className="text-[#dc2626] font-mono w-6">01</span>
                  <span className="text-[#a3a3a3]">Build authoritative state pack from <code className="text-[#e5e5e5]">runState</code></span>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#dc2626] font-mono w-6">02</span>
                  <span className="text-[#a3a3a3]">Add recon hint based on prompt content</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#dc2626] font-mono w-6">03</span>
                  <span className="text-[#a3a3a3]">Query the agent SDK with tool policies</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#dc2626] font-mono w-6">04</span>
                  <span className="text-[#a3a3a3]">Observe tool intents/results and reduce into structured evidence</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#dc2626] font-mono w-6">05</span>
                  <span className="text-[#a3a3a3]">Retry if model used pseudo-tool calls or collected no durable evidence</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#dc2626] font-mono w-6">06</span>
                  <span className="text-[#a3a3a3]">Run a Supervisor checkpoint for verdict</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-[#dc2626] font-mono w-6">07</span>
                  <span className="text-[#a3a3a3]">Return output + verdict + run-state snapshot</span>
                </li>
              </ol>
            </div>
            <div className="h-0.5 bg-[#dc2626]" />
          </div>

          <div className="border border-[#dc2626] bg-[#111111] p-4">
            <p className="text-xs text-[#e5e5e5] leading-relaxed">
              <span className="text-[#dc2626] font-medium">DESIGN CHOICE:</span> Patriot does not trust 
              plain model narrative. It aggressively tries to force tool-backed evidence before 
              accepting a run as complete.
            </p>
          </div>
        </section>

        {/* Subagents */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            SUBAGENTS
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Subagents are defined in patriot/agents/subagents.ts. Each serves a specific role 
            in the orchestration pipeline.
          </p>
          
          <div className="grid gap-4">
            <div className="border border-[#262626] bg-[#111111] p-6">
              <div className="flex items-center gap-3 mb-3">
                <code className="text-xs text-[#dc2626] font-mono">Recon</code>
                <span className="text-[10px] tracking-widest text-[#737373]">PRIMARY</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Composite-first and tool-heavy. Executes reconnaissance operations using 
                the full tooling layer. Prefers composite tools over raw tools.
              </p>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <div className="flex items-center gap-3 mb-3">
                <code className="text-xs text-[#dc2626] font-mono">Reflector</code>
                <span className="text-[10px] tracking-widest text-[#737373]">ANALYSIS</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Analyzes evidence collected during runs. Identifies patterns, gaps, and 
                potential follow-up actions.
              </p>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <div className="flex items-center gap-3 mb-3">
                <code className="text-xs text-[#dc2626] font-mono">Supervisor</code>
                <span className="text-[10px] tracking-widest text-[#737373]">CHECKPOINT</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                Returns strict JSON verdicts to determine run continuation or completion.
              </p>
              <div className="flex flex-wrap gap-2">
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">continue</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">needs_recon</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">revise_plan</code>
                <code className="text-[10px] px-2 py-1 bg-[#0d0d0d] border border-[#262626] text-[#737373]">stop</code>
              </div>
            </div>
          </div>
        </section>

        {/* MCP Exposure */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            MCP TOOL SERVER
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            sdkMcp.ts wraps Patriot tools into an MCP server called <code className="text-[#e5e5e5]">patriot_kali</code>. 
            This is what the Claude SDK sees during runs.
          </p>

          <CodeBlock
            filename="agents/sdkMcp.ts"
            language="typescript"
            code={`// MCP server configuration
export const mcpServer = createMcpServer({
  name: 'patriot_kali',
  tools: [
    ...compositeReconTools,
    ...rawReconTools,
    ...localDiscoveryTools,
  ],
  
  // Runtime config determines execution mode
  execute: async (tool, args, config) => {
    switch (config.executionMode) {
      case 'local':
        return executeLocal(tool, args)
      case 'docker':
        return executeDocker(tool, args)
      case 'ssh':
        return executeSsh(tool, args, config.worker)
      case 'field_sensor':
        return queueFieldSensorJob(tool, args, config.sensor)
    }
  }
})`}
          />
        </section>

        {/* Session Reuse */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            SESSION REUSE
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Patriot can persist underlying SDK session/agent IDs per session and worker. This 
            enables follow-up work with the same worker-specific agent context.
          </p>
          
          <div className="border border-[#262626] bg-[#111111] p-6">
            <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-4">REUSE BEHAVIOR</h3>
            <ul className="space-y-2 text-xs text-[#737373]">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-[#22c55e] mt-1.5" />
                <span><span className="text-[#e5e5e5]">Enabled</span> for local follow-up runs within same session</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-[#22c55e] mt-1.5" />
                <span><span className="text-[#e5e5e5]">Enabled</span> for device enrichment assignments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5" />
                <span><span className="text-[#e5e5e5]">Disabled</span> for remote recon assignments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-[#dc2626] mt-1.5" />
                <span><span className="text-[#e5e5e5]">Disabled</span> for service validation assignments</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/architecture"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div className="text-right">
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Architecture Overview
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/architecture/data-flow"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
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
