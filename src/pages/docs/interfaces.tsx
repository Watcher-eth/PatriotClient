import { DocsLayout } from '@/components/docs/docs-layout'
import { CodeBlock } from '@/components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, Terminal, Globe, Code } from 'lucide-react'

export default function InterfacesPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            INTERFACES / OVERVIEW
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            INTERFACES
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Patriot provides multiple interfaces for integration: a RESTful API, 
            command-line interface, and native SDKs for popular languages.
          </p>
        </div>

        {/* Interface Cards */}
        <div className="grid gap-4">
          <Link 
            href="/docs/interfaces/rest-api"
            className="group border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 border border-[#262626] group-hover:border-[#dc2626] transition-colors">
                  <Globe className="w-5 h-5 text-[#dc2626]" />
                </div>
                <div>
                  <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-2">
                    REST API
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed mb-3">
                    RESTful API with OpenAPI 3.0 specification for programmatic 
                    access to all Patriot features.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      JSON
                    </span>
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      OAuth 2.0
                    </span>
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      Rate Limited
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
            </div>
          </Link>

          <Link 
            href="/docs/interfaces/cli"
            className="group border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 border border-[#262626] group-hover:border-[#dc2626] transition-colors">
                  <Terminal className="w-5 h-5 text-[#dc2626]" />
                </div>
                <div>
                  <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-2">
                    CLI
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed mb-3">
                    Command-line interface for interactive operations, scripting, 
                    and CI/CD integration.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      Interactive
                    </span>
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      Batch Mode
                    </span>
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      JSON Output
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
            </div>
          </Link>

          <Link 
            href="/docs/interfaces/sdk"
            className="group border border-[#262626] bg-[#111111] p-6 hover:border-[#dc2626] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 border border-[#262626] group-hover:border-[#dc2626] transition-colors">
                  <Code className="w-5 h-5 text-[#dc2626]" />
                </div>
                <div>
                  <h3 className="text-xs tracking-wider text-[#e5e5e5] mb-2">
                    SDK
                  </h3>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed mb-3">
                    Native SDKs for TypeScript, Python, Go, and Rust with 
                    type-safe interfaces and async support.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      TypeScript
                    </span>
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      Python
                    </span>
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      Go
                    </span>
                    <span className="text-[10px] px-2 py-1 border border-[#262626] text-[#737373]">
                      Rust
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626] shrink-0" />
            </div>
          </Link>
        </div>

        {/* Quick Example */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            QUICK EXAMPLE
          </h2>
          
          <CodeBlock
            filename="example.ts"
            language="typescript"
            code={`import { PatriotClient } from '@patriot/sdk';

// Initialize client
const patriot = new PatriotClient({
  endpoint: process.env.PATRIOT_ENDPOINT,
  apiKey: process.env.PATRIOT_API_KEY,
});

// Submit a task
const task = await patriot.tasks.submit({
  type: 'analyze-data',
  input: { source: 's3://bucket/data.json' },
});

// Wait for result
const result = await task.wait();
console.log('Analysis complete:', result);`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <h2 className="text-xs tracking-wider text-[#e5e5e5] mb-4">
            EXPLORE INTERFACES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/docs/interfaces/rest-api"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <span className="text-xs tracking-wide text-[#e5e5e5]">
                REST API
              </span>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
            </Link>
            
            <Link
              href="/docs/interfaces/cli"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <span className="text-xs tracking-wide text-[#e5e5e5]">
                CLI
              </span>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
            </Link>
            
            <Link
              href="/docs/interfaces/sdk"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors"
            >
              <span className="text-xs tracking-wide text-[#e5e5e5]">
                SDK
              </span>
              <ArrowRight className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  )
}
