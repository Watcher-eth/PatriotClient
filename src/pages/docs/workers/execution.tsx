import { DocsLayout } from '../../../components/docs/docs-layout'
import { CodeBlock } from '../../../components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function FieldSensorsPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            WORKERS / FIELD SENSORS
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            FIELD SENSORS
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Field sensors are desktop (Electron) and mobile (iOS/Android) applications 
            that provide local network discovery and nearby evidence collection.
          </p>
        </div>

        {/* Sensor Types */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            SENSOR PLATFORMS
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-[#dc2626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">
                DESKTOP SENSOR (ELECTRON)
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                Full-featured sensor with complete local introspection capabilities.
              </p>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  ARP scanning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  TCP/UDP port scanning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  mDNS/DNS-SD discovery
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  Bluetooth scanning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  WiFi network enumeration
                </li>
              </ul>
            </div>

            <div className="border border-[#262626] bg-[#111111] p-6">
              <h3 className="text-xs tracking-wider text-[#dc2626] mb-3">
                MOBILE SENSOR (IOS/ANDROID)
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed mb-4">
                Constrained but portable. Reduced capability set due to platform limits.
              </p>
              <ul className="space-y-2 text-xs text-[#737373]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  Bluetooth LE scanning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#22c55e]" />
                  WiFi network listing
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#eab308]" />
                  Limited port scanning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  No ARP scanning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-[#dc2626]" />
                  No raw socket access
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bootstrap Flow */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            BOOTSTRAP FLOW
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Field sensors enroll with the control plane using a bootstrap token, then 
            poll for jobs to execute.
          </p>
          
          <CodeBlock
            filename="bootstrap flow"
            language="typescript"
            code={`// 1. Sensor enrollment
POST /v1/field-sensors/bootstrap
{
  "bootstrapToken": "fs_bootstrap_abc123",
  "platform": "macos",
  "capabilities": [
    "local_network_scan",
    "arp_scan",
    "bluetooth_scan",
    "wifi_scan"
  ],
  "metadata": {
    "hostname": "macbook-pro-local",
    "os_version": "14.0"
  }
}

// 2. Control plane responds with sensor ID
{
  "sensorId": "sensor_xyz789",
  "pollInterval": 5000,
  "authToken": "eyJ..."
}

// 3. Sensor polls for jobs
GET /v1/field-sensors/jobs/claim
Authorization: Bearer eyJ...

// 4. Execute job and return results
POST /v1/field-sensors/jobs/{jobId}/complete
{
  "result": { ... },
  "evidence": [ ... ]
}`}
          />
        </section>

        {/* Capability Inventory */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            CAPABILITY INVENTORY
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] overflow-hidden overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="bg-[#111111] border-b border-[#262626]">
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">CAPABILITY</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">DESKTOP</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">IOS</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">ANDROID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                <tr>
                  <td className="p-3 text-[#a3a3a3] font-mono">arp_scan</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3] font-mono">port_scan</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#eab308]">Limited</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3] font-mono">bluetooth_scan</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3] font-mono">wifi_scan</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3] font-mono">mdns_discovery</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/workers"
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
              href="/docs/workers/tasks"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT
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
