import { useMemo, useState } from "react"
import {
  ExternalLink,
  FileText,
  GitBranch,
  Monitor,
  Plus,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react"

import {
  coverageMetrics,
  finalizedReports,
  findings,
  overviewMetrics,
} from "@/data/patriot-dashboard"
import { cn } from "@/lib/utils"

type RightTab = "overview" | "findings" | "reports"

const tabs: Array<{
  id: RightTab
  label: string
  icon: typeof FileText
}> = [
  { id: "overview", label: "Overview", icon: Monitor },
  { id: "findings", label: "Findings", icon: TriangleAlert },
  { id: "reports", label: "Reports", icon: FileText },
]

export function PatriotRightRail() {
  const [activeTab, setActiveTab] = useState<RightTab>("findings")

  const tabTitle = useMemo(() => {
    if (activeTab === "overview") {
      return "Visual overview of coverage and operating status."
    }
    if (activeTab === "reports") {
      return "Finalized and in-progress reports for the current case."
    }
    return "Confirmed vulnerabilities found in the current validation run."
  }, [activeTab])

  return (
    <section className="flex min-w-0 flex-col px-4 py-3">
      <div className="mb-4 flex items-center gap-2 border-b border-[#1a1a1a] pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-sm px-3 py-1.5 text-[13px]",
                activeTab === tab.id
                  ? "bg-[#1b1b1b] text-white"
                  : "text-gray-400 hover:text-white",
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
        <button type="button" className="p-2 text-gray-400 hover:text-white">
          <Plus size={16} />
        </button>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <GitBranch size={14} className="text-gray-400" />
        <span className="text-[13px] text-gray-400">Pushed branch</span>
        <a href="#" className="text-[13px] text-[#4c9cff] hover:underline">
          patriot/prod-west-remediation
        </a>
      </div>

      <div className="mb-8 flex items-center gap-4 text-[13px]">
        <a href="#" className="flex items-center gap-1 text-gray-400 hover:text-white">
          View branch on GitHub
          <ExternalLink size={12} />
        </a>
        <a href="#" className="flex items-center gap-1 text-gray-400 hover:text-white">
          View repository
          <ExternalLink size={12} />
        </a>
      </div>

      <div className="mb-4 text-[13px] text-gray-500">{tabTitle}</div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#151515] bg-[#0f0f0f]">
        {activeTab === "overview" ? <OverviewPanel /> : null}
        {activeTab === "findings" ? <FindingsPanel /> : null}
        {activeTab === "reports" ? <ReportsPanel /> : null}
      </div>
    </section>
  )
}

function OverviewPanel() {
  return (
    <div className="p-4">
      <div className="grid gap-3 lg:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <div key={metric.label} className="rounded-sm border border-[#202020] bg-[#151515] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-gray-500">
              {metric.label}
            </div>
            <div className="mt-3 font-mono text-3xl font-semibold text-white">
              {metric.value}
            </div>
            <div className="mt-2 text-sm text-gray-400">{metric.detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-sm border border-[#202020] bg-[#151515] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm text-white">
          <ShieldAlert size={14} />
          Surface coverage
        </div>
        <div className="space-y-4">
          {coverageMetrics.map((metric) => (
            <div key={metric.phase}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-300">{metric.phase}</span>
                <span className="text-gray-500">{metric.value}%</span>
              </div>
              <div className="h-2 rounded-sm bg-[#232323]">
                <div
                  className="h-2 rounded-sm bg-[#ef3340]"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FindingsPanel() {
  return (
    <div className="divide-y divide-[#171717]">
      {findings.map((finding) => (
        <article key={finding.id} className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                "rounded-sm px-2 py-1 text-[11px] uppercase tracking-[0.16em]",
                finding.severity === "critical" && "bg-[#3a1418] text-[#ff8c96]",
                finding.severity === "high" && "bg-[#3a2314] text-[#ffb067]",
                finding.severity === "medium" && "bg-[#3a3314] text-[#ffd166]",
                finding.severity === "low" && "bg-[#16311e] text-[#7ddf9b]",
              )}
            >
              {finding.severity}
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
              {finding.tactic}
            </span>
          </div>
          <h3 className="text-sm font-medium text-white">{finding.title}</h3>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-500">
            {finding.asset}
          </div>
          <p className="mt-3 text-sm text-gray-400">{finding.summary}</p>
          <div className="mt-3 rounded-sm bg-[#151515] p-3 text-sm text-gray-300">
            {finding.impact}
          </div>
        </article>
      ))}
    </div>
  )
}

function ReportsPanel() {
  return (
    <div className="divide-y divide-[#171717]">
      {finalizedReports.map((report) => (
        <article key={report.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-white">{report.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{report.scope}</p>
            </div>
            <span
              className={cn(
                "rounded-sm px-2 py-1 text-[11px] uppercase tracking-[0.16em]",
                report.status === "ready" && "bg-[#16311e] text-[#7ddf9b]",
                report.status === "review" && "bg-[#3a3314] text-[#ffd166]",
                report.status === "exporting" && "bg-[#18293a] text-[#8fc6ff]",
              )}
            >
              {report.status}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span>{report.pages} pages</span>
            <span>{report.updatedAt}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
