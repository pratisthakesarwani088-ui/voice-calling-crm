import { useSearchParams } from "react-router-dom";

import ImportCard from "../components/imports/ImportCard.jsx";
import { IMPORT_ENTITIES } from "../utils/importOptions.js";

/**
 * Import Center (Module 7). Three self-contained cards, one per
 * entity — each owns its own upload/preview/import state
 * independently, so importing Products doesn't affect the Customers
 * card. `?type=` in the URL (used by the Quick Actions / management
 * page entry points) just highlights that card; it doesn't change
 * what's rendered.
 */
function ImportCenterPage() {
  const [searchParams] = useSearchParams();
  const highlightedEntity = searchParams.get("type");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Import Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bulk-import Customers, Products, or Knowledge Base entries from CSV or Excel — manual
          Add/Edit still works exactly as before, alongside this.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {IMPORT_ENTITIES.map((entity) => (
          <div
            key={entity.key}
            id={`import-${entity.key}`}
            className={
              highlightedEntity === entity.key ? "rounded-xl ring-2 ring-blue-400 ring-offset-2" : ""
            }
          >
            <ImportCard entityKey={entity.key} label={entity.label} description={entity.description} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImportCenterPage;
