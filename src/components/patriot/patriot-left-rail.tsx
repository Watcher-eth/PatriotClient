import { useEffect, useRef, type ReactNode } from "react"
import {
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Flag,
  GitBranch,
  GitPullRequest,
  Pause,
  RefreshCw,
  SendHorizontal,
  Settings,
  Square,
  Terminal,
  Wrench,
} from "lucide-react"

import type { StreamItem } from "@/data/patriot-dashboard"
import { Button } from "@/components/ui/button"

type PatriotLeftRailProps = {
  countdown: number
  draft: string
  onDraftChange: (value: string) => void
  onSendMessage: () => void
  streamItems: StreamItem[]
}

export function PatriotLeftRail({
  countdown,
  draft,
  onDraftChange,
  onSendMessage,
  streamItems,
}: PatriotLeftRailProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = scrollRef.current

    if (!container) {
      return
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    })
  }, [streamItems])

  const visibleItems = streamItems.map((item) => {
    if (item.kind === "user") {
      return {
        id: item.id,
        icon: <CheckCircle size={14} className="text-[#ef3340]" />,
        text: item.body,
        highlight: true,
      }
    }

    if (item.kind === "tool") {
      return {
        id: item.id,
        icon: <Terminal size={14} />,
        text: item.command ?? item.body,
        highlight: false,
      }
    }

    if (item.kind === "log") {
      return {
        id: item.id,
        icon: <Wrench size={14} />,
        text: item.body,
        highlight: false,
      }
    }

    return {
      id: item.id,
      icon: <GitBranch size={14} />,
      text: item.body,
      highlight: false,
    }
  })

  return (
    <section className="flex min-w-0 flex-col border-r border-[#1f1f1f]">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-1">
          <WorklogItem icon={<Clock size={14} />} text="Waited 1 s" />
          {visibleItems.map((item) => (
            <WorklogItem
              key={item.id}
              icon={item.icon}
              text={item.text}
              highlight={item.highlight}
            />
          ))}
          <WorklogItem
            icon={<Square size={14} />}
            text="patriot.report build --scope prod-west --format executive"
          />
          <WorklogItem
            icon={<Settings size={14} />}
            text={
              <>
                Created <span className="text-[#ef3340]">evidence bundle</span>{" "}
                <span className="text-[#ef3340]">+12</span>
              </>
            }
          />
        </div>

        <PullRequestCard />
        <ReviewCard />
        <TaskStatusCard />
      </div>

      <div className="border-t border-[#1f1f1f] px-4 py-3">
        <div className="mb-3 flex items-center justify-between bg-[#1a1a1a] px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="font-medium text-[#ef3340]">Autofixing bugs</span>
            <span className="text-sm text-gray-400">
              Patriot Review will find issues and trigger automated fixes.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-sm bg-[#ef3340] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#d62d39]"
            >
              Next step ({countdown}s)
            </button>
            <button
              type="button"
              className="rounded-sm p-2 hover:bg-[#2a2a2a]"
              aria-label="Pause"
            >
              <Pause size={16} />
            </button>
          </div>
        </div>

        <div className="rounded-sm border border-[#2a2a2a] bg-[#171717]">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Send message to Patriot..."
            className="h-24 w-full resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-gray-500"
          />
          <div className="flex items-center justify-between border-t border-[#232323] px-3 py-2">
            <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
              Operator composer
            </span>
            <Button
              type="button"
              onClick={onSendMessage}
              className="h-auto rounded-sm bg-[#ef3340] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#d62d39]"
            >
              Send
              <SendHorizontal size={14} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function PullRequestCard() {
  return (
    <div className="mt-5 rounded-sm border border-[#232323] bg-[#181818] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm text-[#ef3340]">
            <GitPullRequest size={14} />
            Open
          </span>
          <span className="text-sm text-gray-400">Patriot/tenant-prod-west #42</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            <Copy size={14} />
            Copy Context
          </button>
          <ExternalLink size={14} className="text-gray-400" />
        </div>
      </div>
      <h3 className="mb-3 font-medium text-white">
        feat: Patriot production-west validation and remediation pack
      </h3>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>patriot/prod-west-remediation</span>
        <RefreshCw size={12} />
        <span>→</span>
        <span>main</span>
        <RefreshCw size={12} />
      </div>
    </div>
  )
}

function ReviewCard() {
  return (
    <div className="mt-4 border-l border-l-orange-500 pl-3">
      <div className="mb-2 flex items-center gap-2">
        <Flag size={16} className="text-orange-500" />
        <span className="font-medium">Patriot Review found 3 bugs</span>
      </div>
      <p className="mb-3 text-sm text-gray-400">
        Patriot Review found issues. Fix them for this run, or enable auto-fix
        for all Patriot reports.
      </p>
      <button
        type="button"
        className="flex items-center gap-2 rounded-sm bg-[#2a2a2a] px-3 py-1.5 text-sm hover:bg-[#333]"
      >
        Enable auto-fix
        <ChevronDown size={14} />
      </button>
    </div>
  )
}

function TaskStatusCard() {
  return (
    <div className="mt-4 rounded-sm bg-[#1a1a1a] p-4">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-sm border-2 border-gray-500 border-t-transparent" />
        <span className="font-medium">Patriot is replaying the task</span>
        <span className="text-sm text-gray-400">Creating report</span>
      </div>
    </div>
  )
}

function WorklogItem({
  icon,
  text,
  highlight = false,
}: {
  icon: ReactNode
  text: ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 py-1.5 text-[13px] leading-5 ${
        highlight ? "text-white" : "text-gray-400"
      }`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <span className="break-all">{text}</span>
    </div>
  )
}
