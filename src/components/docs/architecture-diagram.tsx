'use client'

export function ArchitectureDiagram() {
  return (
    <div className="my-8 p-6 border border-[#262626] bg-[#0d0d0d]">
      <div className="text-[10px] tracking-widest text-[#737373] mb-4">
        SYSTEM ARCHITECTURE
      </div>
      
      <svg
        viewBox="0 0 800 400"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#grid)"/>
        
        {/* Client Layer */}
        <rect x="50" y="30" width="700" height="60" fill="#111111" stroke="#262626" strokeWidth="1"/>
        <text x="400" y="55" textAnchor="middle" fill="#737373" fontSize="10" letterSpacing="2">CLIENT LAYER</text>
        
        {/* Client boxes */}
        <rect x="80" y="50" width="100" height="30" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
        <text x="130" y="70" textAnchor="middle" fill="#e5e5e5" fontSize="9">CLI</text>
        
        <rect x="200" y="50" width="100" height="30" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
        <text x="250" y="70" textAnchor="middle" fill="#e5e5e5" fontSize="9">REST API</text>
        
        <rect x="320" y="50" width="100" height="30" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
        <text x="370" y="70" textAnchor="middle" fill="#e5e5e5" fontSize="9">SDK</text>
        
        <rect x="440" y="50" width="100" height="30" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
        <text x="490" y="70" textAnchor="middle" fill="#e5e5e5" fontSize="9">CONSOLE</text>
        
        {/* Connection lines from clients to control plane */}
        <line x1="130" y1="80" x2="130" y2="140" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        <line x1="250" y1="80" x2="250" y2="140" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        <line x1="370" y1="80" x2="370" y2="140" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        <line x1="490" y1="80" x2="490" y2="140" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        
        {/* Control Plane */}
        <rect x="50" y="140" width="700" height="80" fill="#111111" stroke="#262626" strokeWidth="1"/>
        <text x="400" y="165" textAnchor="middle" fill="#dc2626" fontSize="10" letterSpacing="2">CONTROL PLANE</text>
        
        {/* Control plane boxes */}
        <rect x="100" y="175" width="120" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
        <text x="160" y="197" textAnchor="middle" fill="#a3a3a3" fontSize="8">ORCHESTRATOR</text>
        
        <rect x="250" y="175" width="120" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
        <text x="310" y="197" textAnchor="middle" fill="#a3a3a3" fontSize="8">SCHEDULER</text>
        
        <rect x="400" y="175" width="120" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
        <text x="460" y="197" textAnchor="middle" fill="#a3a3a3" fontSize="8">STATE MANAGER</text>
        
        <rect x="550" y="175" width="120" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
        <text x="610" y="197" textAnchor="middle" fill="#a3a3a3" fontSize="8">REGISTRY</text>
        
        {/* Connection lines from control plane to workers */}
        <line x1="160" y1="220" x2="160" y2="260" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        <line x1="310" y1="220" x2="310" y2="260" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        <line x1="460" y1="220" x2="460" y2="260" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        <line x1="610" y1="220" x2="610" y2="260" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4"/>
        
        {/* Workers Layer */}
        <rect x="50" y="260" width="700" height="80" fill="#111111" stroke="#262626" strokeWidth="1"/>
        <text x="400" y="285" textAnchor="middle" fill="#737373" fontSize="10" letterSpacing="2">WORKER NODES</text>
        
        {/* Worker boxes */}
        <g>
          <rect x="80" y="295" width="80" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
          <text x="120" y="317" textAnchor="middle" fill="#a3a3a3" fontSize="8">WORKER 01</text>
        </g>
        <g>
          <rect x="180" y="295" width="80" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
          <text x="220" y="317" textAnchor="middle" fill="#a3a3a3" fontSize="8">WORKER 02</text>
        </g>
        <g>
          <rect x="280" y="295" width="80" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
          <text x="320" y="317" textAnchor="middle" fill="#a3a3a3" fontSize="8">WORKER 03</text>
        </g>
        <g>
          <rect x="380" y="295" width="80" height="35" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
          <text x="420" y="317" textAnchor="middle" fill="#a3a3a3" fontSize="8">WORKER N</text>
        </g>
        
        {/* Data Store */}
        <rect x="550" y="295" width="170" height="35" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
        <text x="635" y="317" textAnchor="middle" fill="#e5e5e5" fontSize="8">DATA STORE</text>
        
        {/* Legend */}
        <g transform="translate(600, 360)">
          <rect x="0" y="0" width="10" height="10" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
          <text x="20" y="9" fill="#737373" fontSize="8">PRIMARY</text>
          
          <rect x="80" y="0" width="10" height="10" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
          <text x="100" y="9" fill="#737373" fontSize="8">SECONDARY</text>
        </g>
      </svg>
    </div>
  )
}

export function DataFlowDiagram() {
  return (
    <div className="my-8 p-6 border border-[#262626] bg-[#0d0d0d]">
      <div className="text-[10px] tracking-widest text-[#737373] mb-4">
        DATA FLOW
      </div>
      
      <svg
        viewBox="0 0 600 200"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
          </pattern>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
          </marker>
        </defs>
        <rect width="600" height="200" fill="url(#grid2)"/>
        
        {/* Request */}
        <rect x="20" y="80" width="80" height="40" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
        <text x="60" y="105" textAnchor="middle" fill="#e5e5e5" fontSize="9">REQUEST</text>
        
        {/* Arrow 1 */}
        <line x1="100" y1="100" x2="140" y2="100" stroke="#dc2626" strokeWidth="1" markerEnd="url(#arrowhead)"/>
        
        {/* API Gateway */}
        <rect x="150" y="80" width="80" height="40" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
        <text x="190" y="105" textAnchor="middle" fill="#a3a3a3" fontSize="9">GATEWAY</text>
        
        {/* Arrow 2 */}
        <line x1="230" y1="100" x2="270" y2="100" stroke="#dc2626" strokeWidth="1" markerEnd="url(#arrowhead)"/>
        
        {/* Controller */}
        <rect x="280" y="80" width="80" height="40" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
        <text x="320" y="105" textAnchor="middle" fill="#a3a3a3" fontSize="9">CONTROL</text>
        
        {/* Arrow 3 */}
        <line x1="360" y1="100" x2="400" y2="100" stroke="#dc2626" strokeWidth="1" markerEnd="url(#arrowhead)"/>
        
        {/* Worker */}
        <rect x="410" y="80" width="80" height="40" fill="#1a1a1a" stroke="#262626" strokeWidth="1"/>
        <text x="450" y="105" textAnchor="middle" fill="#a3a3a3" fontSize="9">WORKER</text>
        
        {/* Arrow 4 */}
        <line x1="490" y1="100" x2="530" y2="100" stroke="#dc2626" strokeWidth="1" markerEnd="url(#arrowhead)"/>
        
        {/* Response */}
        <rect x="540" y="80" width="50" height="40" fill="#1a1a1a" stroke="#dc2626" strokeWidth="1"/>
        <text x="565" y="105" textAnchor="middle" fill="#e5e5e5" fontSize="9">OUT</text>
        
        {/* Labels */}
        <text x="120" y="70" textAnchor="middle" fill="#737373" fontSize="7">AUTH</text>
        <text x="250" y="70" textAnchor="middle" fill="#737373" fontSize="7">ROUTE</text>
        <text x="380" y="70" textAnchor="middle" fill="#737373" fontSize="7">SCHEDULE</text>
        <text x="510" y="70" textAnchor="middle" fill="#737373" fontSize="7">EXECUTE</text>
        
        {/* Time indicator */}
        <line x1="20" y1="160" x2="580" y2="160" stroke="#262626" strokeWidth="1"/>
        <text x="300" y="180" textAnchor="middle" fill="#737373" fontSize="8" letterSpacing="2">EXECUTION TIMELINE</text>
      </svg>
    </div>
  )
}
