'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language = 'typescript', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 border border-[#262626] bg-[#0d0d0d] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626] bg-[#111111]">
        <div className="flex items-center gap-3">
          {filename && (
            <span className="text-xs text-[#a3a3a3] tracking-wide">{filename}</span>
          )}
          <span className="text-[10px] tracking-wider text-[#737373] uppercase">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] tracking-wider text-[#737373] hover:text-[#a3a3a3] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-500">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs leading-relaxed">
          <code className="text-[#e5e5e5]">{code}</code>
        </pre>
      </div>

      {/* Red accent line */}
      <div className="h-0.5 bg-[#dc2626]" />
    </div>
  )
}
