import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "../hooks/useAuth.js";

/**
 * Admin profile control in the navbar: avatar + name, expands into a
 * small dropdown with the account's role and a logout action. Closes
 * on outside click so it behaves like a normal menu.
 */
function ProfileMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm hover:bg-gray-50"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate font-medium text-gray-900">
            {user?.full_name || "Admin"}
          </span>
        </span>
        <ChevronDown size={16} className="hidden text-gray-400 sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.full_name || "Admin"}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
            {user?.role && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium capitalize text-blue-700">
                <UserCircle size={12} />
                {user.role}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
