'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface DocSection {
  title: string
  href: string
  items: { title: string; href: string }[]
}

const docsSections: DocSection[] = [
  {
    title: 'ARCHITECTURE',
    href: '/docs/architecture',
    items: [
      { title: 'Overview', href: '/docs/architecture' },
      { title: 'System Design', href: '/docs/architecture/system-design' },
      { title: 'Data Flow', href: '/docs/architecture/data-flow' },
      { title: 'Security Model', href: '/docs/architecture/security' },
    ],
  },
  {
    title: 'CONTROL PLANE',
    href: '/docs/control-plane',
    items: [
      { title: 'Overview', href: '/docs/control-plane' },
      { title: 'Orchestration', href: '/docs/control-plane/orchestration' },
      { title: 'Scheduling', href: '/docs/control-plane/scheduling' },
      { title: 'State Management', href: '/docs/control-plane/state' },
    ],
  },
  {
    title: 'WORKERS',
    href: '/docs/workers',
    items: [
      { title: 'Overview', href: '/docs/workers' },
      { title: 'Execution Engine', href: '/docs/workers/execution' },
      { title: 'Task Processing', href: '/docs/workers/tasks' },
      { title: 'Scaling', href: '/docs/workers/scaling' },
    ],
  },
  {
    title: 'INTERFACES',
    href: '/docs/interfaces',
    items: [
      { title: 'Overview', href: '/docs/interfaces' },
      { title: 'REST API', href: '/docs/interfaces/rest-api' },
      { title: 'CLI', href: '/docs/interfaces/cli' },
      { title: 'SDK', href: '/docs/interfaces/sdk' },
    ],
  },
]

function SidebarSection({ section }: { section: DocSection }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(section.href)
  const [isOpen, setIsOpen] = useState(isActive)

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs tracking-wider transition-colors ${
          isActive ? 'text-[#dc2626]' : 'text-[#737373] hover:text-[#a3a3a3]'
        }`}
      >
        <span>{section.title}</span>
        {isOpen ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>

      {isOpen && (
        <div className="ml-3 border-l border-[#262626]">
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 text-xs tracking-wide transition-colors ${
                pathname === item.href
                  ? 'text-[#e5e5e5] border-l-2 border-[#dc2626] -ml-px bg-[#1a1a1a]/50'
                  : 'text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function DocsSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-[#262626] bg-[#0d0d0d] overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <span className="text-[10px] tracking-widest text-[#737373]">
            DOCUMENTATION
          </span>
          <div className="text-xs text-[#a3a3a3] mt-1">v2.4.1</div>
        </div>

        <nav>
          {docsSections.map((section) => (
            <SidebarSection key={section.href} section={section} />
          ))}
        </nav>
      </div>
    </aside>
  )
}

export function MobileDocsSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="fixed left-0 top-14 bottom-0 w-64 bg-[#0d0d0d] border-r border-[#262626] overflow-y-auto">
        <div className="p-4">
          <div className="mb-6">
            <span className="text-[10px] tracking-widest text-[#737373]">
              DOCUMENTATION
            </span>
            <div className="text-xs text-[#a3a3a3] mt-1">v2.4.1</div>
          </div>

          <nav>
            {docsSections.map((section) => (
              <SidebarSection key={section.href} section={section} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
