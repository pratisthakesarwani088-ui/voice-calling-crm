import { BookOpen } from "lucide-react";

import ActionButtons from "../ActionButtons.jsx";
import Badge from "../Badge.jsx";
import { KNOWLEDGE_PRIORITY_VARIANT, KNOWLEDGE_STATUS_VARIANT } from "../../utils/knowledgeOptions.js";

/**
 * Knowledge Base table. Only View/Edit/Delete are in scope (no Call
 * button) — same `visibleActions` mechanism used by ProductTable.
 * `productNameById` is a lookup built by the parent page so this table
 * can show a human-readable product name without each row needing its
 * own product fetch.
 */
function KnowledgeTable({ entries, productNameById, onView, onEdit, onDelete, onAddEntry }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <BookOpen size={22} />
        </span>
        <p className="text-sm font-medium text-gray-500">No Knowledge Base Found.</p>
        <button
          type="button"
          onClick={onAddEntry}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Knowledge
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-5 py-3 font-medium">Title</th>
            <th className="px-5 py-3 font-medium">Linked Product</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Priority</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Created Date</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="max-w-xs truncate px-5 py-3.5 font-medium text-gray-900">
                {entry.title}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {productNameById[entry.product_id] || `#${entry.product_id}`}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{entry.category}</td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <Badge
                  label={entry.priority}
                  variant={KNOWLEDGE_PRIORITY_VARIANT[entry.priority] || "neutral"}
                  className="capitalize"
                />
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <Badge
                  label={entry.status}
                  variant={KNOWLEDGE_STATUS_VARIANT[entry.status] || "neutral"}
                  className="capitalize"
                />
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">
                {new Date(entry.created_at).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <ActionButtons
                  visibleActions={["view", "edit", "delete"]}
                  onView={() => onView(entry)}
                  onEdit={() => onEdit(entry)}
                  onDelete={() => onDelete(entry)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default KnowledgeTable;
