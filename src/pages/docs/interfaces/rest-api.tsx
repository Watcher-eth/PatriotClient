import { DocsLayout } from '../../../components/docs/docs-layout'
import { CodeBlock } from '../../../components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function RestApiPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            INTERFACES / REST API
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            REST API
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            The REST API provides programmatic access to all Patriot features via 
            standard HTTP methods with JSON request/response bodies.
          </p>
        </div>

        {/* Base URL */}
        <div className="border border-[#dc2626] bg-[#111111] p-4">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            BASE URL
          </div>
          <code className="text-sm text-[#e5e5e5]">
            https://api.patriot.example.com/v1
          </code>
        </div>

        {/* Authentication */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            AUTHENTICATION
          </h2>
          
          <CodeBlock
            filename="curl"
            language="bash"
            code={`# Using API Key
curl -X GET "https://api.patriot.example.com/v1/tasks" \\
  -H "Authorization: Bearer pk_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json"

# Using OAuth 2.0 token
curl -X GET "https://api.patriot.example.com/v1/tasks" \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"`}
          />
        </section>

        {/* Endpoints */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            ENDPOINTS
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] overflow-hidden">
            <div className="divide-y divide-[#262626]">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 text-[10px] tracking-wider bg-green-900/50 text-green-400 border border-green-800">
                    GET
                  </span>
                  <code className="text-xs text-[#e5e5e5]">/tasks</code>
                </div>
                <p className="text-xs text-[#737373]">List all tasks</p>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 text-[10px] tracking-wider bg-blue-900/50 text-blue-400 border border-blue-800">
                    POST
                  </span>
                  <code className="text-xs text-[#e5e5e5]">/tasks</code>
                </div>
                <p className="text-xs text-[#737373]">Submit a new task</p>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 text-[10px] tracking-wider bg-green-900/50 text-green-400 border border-green-800">
                    GET
                  </span>
                  <code className="text-xs text-[#e5e5e5]">/tasks/:id</code>
                </div>
                <p className="text-xs text-[#737373]">Get task status and details</p>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 text-[10px] tracking-wider bg-red-900/50 text-red-400 border border-red-800">
                    DELETE
                  </span>
                  <code className="text-xs text-[#e5e5e5]">/tasks/:id</code>
                </div>
                <p className="text-xs text-[#737373]">Cancel a running task</p>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 text-[10px] tracking-wider bg-green-900/50 text-green-400 border border-green-800">
                    GET
                  </span>
                  <code className="text-xs text-[#e5e5e5]">/workers</code>
                </div>
                <p className="text-xs text-[#737373]">List connected workers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Example Request */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            EXAMPLE: SUBMIT TASK
          </h2>
          
          <CodeBlock
            filename="request.json"
            language="json"
            code={`POST /v1/tasks HTTP/1.1
Host: api.patriot.example.com
Authorization: Bearer pk_live_xxxxxxxxxxxx
Content-Type: application/json

{
  "type": "process-data",
  "input": {
    "dataUrl": "s3://bucket/input.json",
    "format": "json"
  },
  "priority": "HIGH",
  "tags": ["production"],
  "timeout": "30m"
}`}
          />
          
          <CodeBlock
            filename="response.json"
            language="json"
            code={`HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "task_abc123def456",
  "status": "PENDING",
  "type": "process-data",
  "createdAt": "2024-01-15T10:30:00Z",
  "priority": "HIGH",
  "links": {
    "self": "/v1/tasks/task_abc123def456",
    "events": "/v1/tasks/task_abc123def456/events"
  }
}`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/interfaces"
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
              href="/docs/interfaces/cli"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  CLI
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
