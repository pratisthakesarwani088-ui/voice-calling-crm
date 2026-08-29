import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">404</h2>
      <p className="text-gray-500 mb-6">Page not found.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Back to home
      </Link>
    </div>
  );
}

export default NotFoundPage;
