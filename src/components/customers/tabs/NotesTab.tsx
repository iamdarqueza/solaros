"use client";
import React, { useEffect, useState } from "react";
import { customersService, Customer, CustomerNote } from "@/services/customersService";
import { TabSkeleton, SectionCard } from "../CustomerUIHelpers";

interface NotesTabProps {
  customer: Customer;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-brand-500",
  "bg-success-500",
  "bg-warning-500",
  "bg-purple-500",
  "bg-orange-500",
];

function authorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function NotesTab({ customer }: NotesTabProps) {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    customersService.getNotes(customer.id).then((data) => {
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Pinned notes first
      const pinned = sorted.filter((n) => n.is_pinned);
      const rest = sorted.filter((n) => !n.is_pinned);
      setNotes([...pinned, ...rest]);
      setLoading(false);
    });
  }, [customer.id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      const added = await customersService.addNote(
        customer.id,
        newNote.trim(),
        "You",
        "Account Manager"
      );
      setNotes((prev) => [added, ...prev]);
      setNewNote("");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <TabSkeleton />;

  return (
    <div className="space-y-5">
      {/* Add new note */}
      <SectionCard className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add Note</h3>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type a note about this customer..."
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">{newNote.length}/500</span>
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim() || submitting || newNote.length > 500}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Note
              </>
            )}
          </button>
        </div>
      </SectionCard>

      {/* Notes feed */}
      {notes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <SectionCard key={note.id} className={note.is_pinned ? "border-brand-200 dark:border-brand-500/30 ring-1 ring-brand-100 dark:ring-brand-500/10" : ""}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${authorColor(note.author_name)}`}>
                    {getInitials(note.author_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {note.author_name}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          · {note.author_role}
                        </span>
                        {note.is_pinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {timeAgo(note.created_at)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
