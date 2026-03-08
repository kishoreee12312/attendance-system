import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav
      style={{
        backgroundColor: "#333",
        padding: "15px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white"
      }}
    >
      <Link to="/" style={{ color: "white", textDecoration: "none" }}>
        <h2>Smart Attendance</h2>
      </Link>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/admin" style={{ color: "white", textDecoration: "none" }}>
          Dashboard
        </Link>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 15px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "5px"
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
