import { DocsLayout } from '../../../components/docs/docs-layout'
import { CodeBlock } from '../../../components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function CliPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            INTERFACES / CLI
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            COMMAND LINE INTERFACE
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            The Patriot CLI provides powerful command-line access for task management, 
            cluster operations, and CI/CD integration.
          </p>
        </div>

        {/* Installation */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            INSTALLATION
          </h2>
          
          <CodeBlock
            filename="terminal"
            language="bash"
            code={`# Install via npm
npm install -g @patriot/cli

# Or via Homebrew (macOS)
brew install patriot-io/tap/patriot

# Verify installation
patriot --version
# patriot-cli v2.4.1`}
          />
        </section>

        {/* Configuration */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            CONFIGURATION
          </h2>
          
          <CodeBlock
            filename="terminal"
            language="bash"
            code={`# Login with API key
patriot auth login --api-key pk_live_xxxxxxxxxxxx

# Or interactive login
patriot auth login
# Opens browser for OAuth authentication

# Set default cluster
patriot config set cluster production

# View current configuration
patriot config list`}
          />
        </section>

        {/* Commands */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            COMMANDS
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="text-left p-4 text-[#737373] tracking-wider font-normal">
                    COMMAND
                  </th>
                  <th className="text-left p-4 text-[#737373] tracking-wider font-normal">
                    DESCRIPTION
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#262626]">
                  <td className="p-4 text-[#dc2626] font-mono">patriot tasks list</td>
                  <td className="p-4 text-[#a3a3a3]">List all tasks</td>
                </tr>
                <tr className="border-b border-[#262626]">
                  <td className="p-4 text-[#dc2626] font-mono">patriot tasks submit</td>
                  <td className="p-4 text-[#a3a3a3]">Submit a new task</td>
                </tr>
                <tr className="border-b border-[#262626]">
                  <td className="p-4 text-[#dc2626] font-mono">patriot tasks logs</td>
                  <td className="p-4 text-[#a3a3a3]">Stream task logs</td>
                </tr>
                <tr className="border-b border-[#262626]">
                  <td className="p-4 text-[#dc2626] font-mono">patriot workers list</td>
                  <td className="p-4 text-[#a3a3a3]">List connected workers</td>
                </tr>
                <tr className="border-b border-[#262626]">
                  <td className="p-4 text-[#dc2626] font-mono">patriot workers scale</td>
                  <td className="p-4 text-[#a3a3a3]">Scale worker pool</td>
                </tr>
                <tr>
                  <td className="p-4 text-[#dc2626] font-mono">patriot cluster status</td>
                  <td className="p-4 text-[#a3a3a3]">Show cluster health</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Examples */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            EXAMPLES
          </h2>
          
          <CodeBlock
            filename="terminal"
            language="bash"
            code={`# Submit a task from a file
patriot tasks submit -f task.yaml

# Submit with inline parameters
patriot tasks submit \\
  --type process-data \\
  --input '{"url": "s3://bucket/data.json"}' \\
  --priority high

# Watch task progress
patriot tasks watch task_abc123

# Stream logs in real-time
patriot tasks logs task_abc123 --follow

# List recent tasks with filtering
patriot tasks list \\
  --status running \\
  --limit 10 \\
  --output json

# Scale workers
patriot workers scale --replicas 20`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/interfaces/rest-api"
              className="group flex items-center gap-2 p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  REST API
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/interfaces/sdk"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  SDK
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
