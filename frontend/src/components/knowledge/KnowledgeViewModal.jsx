import Badge from "../Badge.jsx";
import Modal from "../Modal.jsx";
import { KNOWLEDGE_PRIORITY_VARIANT, KNOWLEDGE_STATUS_VARIANT } from "../../utils/knowledgeOptions.js";

/**
 * Read-only detail view for a single Knowledge Base entry — mirrors
 * components/customers/CustomerViewModal.jsx's pattern.
 */
function KnowledgeViewModal({ isOpen, entry, productName, onClose }) {
  if (!entry) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Knowledge Details" maxWidthClassName="max-w-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-gray-900">{entry.title}</p>
          <p className="text-sm text-gray-500">
            Linked to: {productName || `Product #${entry.product_id}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge
            label={entry.status}
            variant={KNOWLEDGE_STATUS_VARIANT[entry.status] || "neutral"}
            className="capitalize"
          />
          <Badge
            label={`${entry.priority} priority`}
            variant={KNOWLEDGE_PRIORITY_VARIANT[entry.priority] || "neutral"}
            className="capitalize"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Category</dt>
          <dd className="mt-0.5 text-sm text-gray-800">{entry.category}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Question</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">{entry.question}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Answer</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">{entry.answer}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Keywords</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {entry.keywords && entry.keywords.length > 0 ? (
              entry.keywords.map((keyword) => (
                <Badge key={keyword} label={keyword} variant="info" />
              ))
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </dd>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
        <div>Created: {new Date(entry.created_at).toLocaleString()}</div>
        <div>Updated: {new Date(entry.updated_at).toLocaleString()}</div>
      </div>
    </Modal>
  );
}

export default KnowledgeViewModal;
