import { Link } from "react-router-dom";

import Logo from "../components/Logo.jsx";
import { useBackendHealth } from "../hooks/useBackendHealth.js";
import { BRAND, ROUTES } from "../utils/constants.js";

const STATUS_STYLES = {
  checking: "bg-yellow-100 text-yellow-800",
  online: "bg-green-100 text-green-800",
  offline: "bg-red-100 text-red-800",
};

const STATUS_LABEL = {
  checking: "Checking backend...",
  online: "Backend connected",
  offline: "Backend unreachable",
};

/**
 * Landing page. Module 1 built this as a backend-connectivity check;
 * Module 4 adds the TechNova Electronics branding on top of it without
 * removing that check — still useful as a quick "is the API up" signal.
 */
function HomePage() {
  const { status, data } = useBackendHealth();

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={52} />
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">{BRAND.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{BRAND.tagline}</p>
        <Link
          to={ROUTES.LOGIN}
          className="mt-5 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Project Foundation Ready
        </h2>
        <p className="mb-6 text-gray-500">Backend connectivity check</p>

        <div className="mb-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {data && (
          <dl className="space-y-1 text-sm text-gray-600">
            <div className="flex gap-2">
              <dt className="font-medium">App:</dt>
              <dd>{data.app_name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium">Environment:</dt>
              <dd>{data.environment}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}

export default HomePage;
