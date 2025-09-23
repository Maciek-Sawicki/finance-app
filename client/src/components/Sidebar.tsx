import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { name: "Dashboard", to: "/" },
    { name: "Accounts", to: "/accounts" },
    { name: "Transactions", to: "/transactions" },
    { name: "Reports", to: "/reports" },
    { name: "Settings", to: "/settings" },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-6">Finance App</h1>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `p-2 rounded mb-2 hover:bg-gray-700 ${isActive ? "bg-gray-700" : ""}`
          }
        >
          {link.name}
        </NavLink>
      ))}
    </aside>
  );
}
