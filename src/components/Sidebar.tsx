import { useState } from "react";
import type { Session } from "../hooks/useSession";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onCreateSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onFilterChange: (from: string, to: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
  onFilterChange,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleFilterChange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    onFilterChange(from, to);
  };

  if (collapsed) {
    return (
      <div className="w-10 flex-shrink-0 bg-[--bg-primary] border-r border-[--border-color] flex flex-col items-center pt-4 h-screen sticky top-0">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[--bg-secondary] rounded-md text-[--text-secondary] transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0 bg-[--bg-primary] border-r border-[--border-color] flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[--border-color] flex items-center justify-between">
        <button
          onClick={onCreateSession}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--color-accent-blue)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>
        <button
          onClick={onToggleCollapse}
          className="ml-2 p-2 hover:bg-[--bg-secondary] rounded-md text-[--text-secondary] transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Date Filter */}
      <div className="p-3 border-b border-[--border-color]">
        <label className="block text-xs font-medium text-[--text-secondary] mb-1">
          Filter by date
        </label>
        <div className="flex flex-col gap-1">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFilterChange(e.target.value, toDate)}
            className="w-full px-2 py-1 text-xs bg-[--bg-secondary] border border-[--border-color] rounded text-[--text-primary]"
            placeholder="From"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleFilterChange(fromDate, e.target.value)}
            className="w-full px-2 py-1 text-xs bg-[--bg-secondary] border border-[--border-color] rounded text-[--text-primary]"
            placeholder="To"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => handleFilterChange("", "")}
            className="mt-1 text-xs text-[var(--color-accent-blue)] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="p-4 text-sm text-[--text-secondary] italic text-center">
            No sessions yet
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-[--border-color] transition-colors ${
                session.id === activeSessionId
                  ? "bg-[var(--color-accent-blue)]/10 border-l-2 border-l-[var(--color-accent-blue)]"
                  : "hover:bg-[--bg-secondary]"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[--text-primary] truncate">
                  {session.name}
                </p>
                <p className="text-xs text-[--text-secondary]">
                  {new Date(session.updated_at + "Z").toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-[--text-secondary] hover:text-red-500 rounded transition-all"
                title="Delete session"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
