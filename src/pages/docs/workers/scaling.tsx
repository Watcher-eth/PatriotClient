import { DocsLayout } from '../../../components/docs/docs-layout'
import { CodeBlock } from '../../../components/docs/code-block'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function CapabilityModelPage() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8">
          <div className="text-[10px] tracking-widest text-[#737373] mb-2">
            WORKERS / CAPABILITY MODEL
          </div>
          <h1 className="text-xl md:text-2xl tracking-[0.1em] text-[#e5e5e5] mb-4">
            CAPABILITY MODEL
          </h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-2xl">
            Capabilities are not just declared—they are derived from tool availability, 
            platform constraints, and adapter health.
          </p>
        </div>

        {/* Capability Inventory */}
        <section className="space-y-6">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            INVENTORY STRUCTURE
          </h2>
          
          <CodeBlock
            filename="lib/controlplane/types.ts"
            language="typescript"
            code={`interface WorkerProfile {
  id: string
  type: WorkerType
  platform: Platform
  
  // What the worker declares it can do
  capabilities: string[]
  
  // Detailed inventories for matching
  capabilityInventory: CapabilityInventory
  toolInventory: ToolInventory
  permissionInventory: PermissionInventory
  
  // Adapter-specific metadata
  adapterMetadata: AdapterMetadata
}

interface CapabilityInventory {
  // Standard capability flags
  hasNmap: boolean
  hasNikto: boolean
  hasNuclei: boolean
  hasGobuster: boolean
  
  // Local-only capabilities
  hasArpScan: boolean
  hasBluetoothScan: boolean
  hasWifiScan: boolean
  
  // Platform-specific
  hasWirelessMonitor: boolean
  hasWirelessInjection: boolean
}`}
          />
        </section>

        {/* Platform Capabilities */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            PLATFORM CAPABILITY MATRIX
          </h2>
          
          <div className="border border-[#262626] bg-[#0d0d0d] overflow-hidden overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="bg-[#111111] border-b border-[#262626]">
                  <th className="text-left p-3 text-[#737373] font-normal tracking-wider">CAPABILITY</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">KALI</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">MACOS</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">LINUX</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">WINDOWS</th>
                  <th className="text-center p-3 text-[#737373] font-normal tracking-wider">IOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                <tr>
                  <td className="p-3 text-[#a3a3a3]">Full recon suite</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#eab308]">Partial</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3]">Local network scan</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#eab308]">Limited</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3]">Bluetooth scan</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3]">Wireless monitor</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#eab308]">Hardware</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                </tr>
                <tr>
                  <td className="p-3 text-[#a3a3a3]">Wireless injection</td>
                  <td className="p-3 text-center text-[#22c55e]">✓</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                  <td className="p-3 text-center text-[#dc2626]">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Derived Health */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            DERIVED HEALTH
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Worker health is not just a heartbeat—it&apos;s derived from adapter status, 
            tool availability, and recent execution success rates.
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-[#22c55e] bg-[#111111] p-4">
              <code className="text-xs text-[#22c55e] font-mono">healthy</code>
              <p className="text-xs text-[#737373] mt-2">
                All adapters operational. All declared capabilities available.
              </p>
            </div>
            <div className="border border-[#eab308] bg-[#111111] p-4">
              <code className="text-xs text-[#eab308] font-mono">degraded</code>
              <p className="text-xs text-[#737373] mt-2">
                Some capabilities limited. May still accept compatible assignments.
              </p>
            </div>
            <div className="border border-[#dc2626] bg-[#111111] p-4">
              <code className="text-xs text-[#dc2626] font-mono">blocked</code>
              <p className="text-xs text-[#737373] mt-2">
                Cannot execute tasks. Removed from routing until recovered.
              </p>
            </div>
          </div>
        </section>

        {/* Permission Inventory */}
        <section className="space-y-4">
          <h2 className="text-sm tracking-wider text-[#e5e5e5]">
            PERMISSION INVENTORY
          </h2>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">
            Mobile sensors especially have constrained permissions that affect capability.
          </p>
          
          <CodeBlock
            filename="permission inventory"
            language="typescript"
            code={`interface PermissionInventory {
  // Network permissions
  localNetworkAccess: boolean
  rawSocketAccess: boolean
  
  // Bluetooth permissions
  bluetoothScanPermission: boolean
  bluetoothAdvertisePermission: boolean
  
  // Location (affects some scans)
  locationPermission: boolean
  backgroundLocationPermission: boolean
  
  // iOS-specific
  localNetworkPrivacyDescription: string | null
}

// Example: iOS sensor with limited permissions
const iosSensorPermissions: PermissionInventory = {
  localNetworkAccess: true,
  rawSocketAccess: false,  // iOS limitation
  bluetoothScanPermission: true,
  bluetoothAdvertisePermission: false,
  locationPermission: true,
  backgroundLocationPermission: false,
  localNetworkPrivacyDescription: "Required for network scanning"
}`}
          />
        </section>

        {/* Navigation */}
        <section className="border-t border-[#262626] pt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/docs/workers/tasks"
              className="group flex items-center gap-2 p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <ArrowLeft className="w-4 h-4 text-[#737373] group-hover:text-[#dc2626]" />
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  PREVIOUS
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Recon Tools
                </div>
              </div>
            </Link>
            
            <Link
              href="/docs/interfaces"
              className="group flex items-center justify-between p-4 border border-[#262626] hover:border-[#dc2626] transition-colors flex-1"
            >
              <div>
                <div className="text-[10px] tracking-widest text-[#737373] mb-1">
                  NEXT SECTION
                </div>
                <div className="text-xs tracking-wide text-[#e5e5e5]">
                  Interfaces
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
