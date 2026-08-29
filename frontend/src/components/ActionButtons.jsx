import { Eye, Pencil, Phone, Trash2 } from "lucide-react";

/**
 * Standard row-action button group for the Action column reserved in
 * every data table (Recent Calls in Module 4; Customers in Module 5;
 * Products/Knowledge Base in Module 6).
 *
 * `visibleActions` controls which buttons render at all — defaults to
 * all four (`view`, `call`, `edit`, `delete`), preserving Module 4/5's
 * existing behavior unchanged for callers that don't pass it. Module 6
 * uses it to omit Call for Products/Knowledge Base (only View/Edit/
 * Delete are in scope there) without touching this component's
 * existing default for other tables.
 *
 * A button whose handler is omitted still renders, disabled — per
 * "reserve the column, don't implement the action" (Module 4's Recent
 * Calls table). A future module makes it functional by passing the
 * handler; nothing about the table markup needs to change.
 */
function ActionButtons({
  onView,
  onEdit,
  onDelete,
  onCall,
  visibleActions = ["view", "call", "edit", "delete"],
}) {
  const allActions = [
    { key: "view", label: "View", Icon: Eye, handler: onView },
    { key: "call", label: "Call", Icon: Phone, handler: onCall },
    { key: "edit", label: "Edit", Icon: Pencil, handler: onEdit },
    { key: "delete", label: "Delete", Icon: Trash2, handler: onDelete },
  ];
  const actions = allActions.filter((action) => visibleActions.includes(action.key));

  return (
    <div className="flex items-center justify-end gap-1">
      {actions.map(({ key, label, Icon, handler }) => (
        <button
          key={key}
          type="button"
          disabled={!handler}
          title={handler ? label : "Coming soon"}
          aria-label={label}
          onClick={handler}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

export default ActionButtons;
