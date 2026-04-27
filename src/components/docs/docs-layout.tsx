'use client'

import { useState } from 'react'
import { Navigation } from './navigation'
import { DocsSidebar, MobileDocsSidebar } from './docs-sidebar'
import { Menu } from 'lucide-react'

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0a]">
      <Navigation />

      <div className="flex h-[calc(100vh-3.5rem)] pt-14">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed left-0 top-14 bottom-0 w-64 overflow-y-auto">
          <DocsSidebar />
        </div>

        {/* Mobile Sidebar */}
        <MobileDocsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-0 overflow-y-auto">
          {/* Mobile sidebar toggle */}
          <div className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-4 py-3 border-b border-[#262626] bg-[#0a0a0a]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 text-xs tracking-wider text-[#737373] hover:text-[#a3a3a3]"
            >
              <Menu className="w-4 h-4" />
              <span>MENU</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
