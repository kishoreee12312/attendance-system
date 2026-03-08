import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const isAdmin = location.pathname.startsWith("/admin");
  const isFaculty = location.pathname.startsWith("/faculty");
  const isStudent = location.pathname.startsWith("/student");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = isAdmin
    ? [
        { to: "/admin", label: "Dashboard" },
        { to: "/admin/students", label: "Students" },
        { to: "/admin/faculty", label: "Faculty" },
        { to: "/admin/subjects", label: "Subjects" },
        { to: "/admin/class-management", label: "Class Management" },
        { to: "/admin/assign-subjects", label: "Assign Subjects" }
      ]
    : isFaculty
      ? [
          { to: "/faculty", label: "Dashboard" },
          { to: "/faculty/class-management", label: "Class Management" }
        ]
      : isStudent
        ? [{ to: "/student", label: "Dashboard" }]
        : [];

  return (
    <div className="flex min-h-screen">
      {(isAdmin || isFaculty || isStudent) && (
        <aside className="w-72 p-6">
          <div className="glass-card h-full p-6 flex flex-col">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Smart Attendance</p>
              <h2 className="text-2xl font-extrabold text-slate-800 mt-2">Control Panel</h2>
            </div>

            <nav className="space-y-2 flex-1">
              {menuItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`block px-4 py-3 rounded-xl transition-all font-medium ${
                      active
                        ? "bg-teal-700 text-white shadow-lg"
                        : "text-slate-700 hover:bg-teal-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              Logout
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}

export default Layout;
