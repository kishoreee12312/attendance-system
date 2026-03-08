import React, { useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function FacultyAddStudent() {
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", year: "" });
  const [msg, setMsg] = useState("");

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = e => {
    e.preventDefault();
    API.post("/students/create", form)
      .then(() => {
        setMsg("Student created successfully!");
        setForm({ name: "", email: "", password: "", department: "", year: "" });
      })
      .catch(() => setMsg("Error creating student."));
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Add Student</h2>
      <form className="bg-white p-4 rounded shadow mb-6" onSubmit={handleCreate}>
        <input name="name" value={form.name} onChange={handleInput} placeholder="Name" className="border p-2 w-full mb-2" required />
        <input name="email" value={form.email} onChange={handleInput} placeholder="Email" className="border p-2 w-full mb-2" required />
        <input name="password" value={form.password} onChange={handleInput} placeholder="Password" className="border p-2 w-full mb-2" required />
        <input name="department" value={form.department} onChange={handleInput} placeholder="Department" className="border p-2 w-full mb-2" required />
        <input name="year" value={form.year} onChange={handleInput} placeholder="Year" className="border p-2 w-full mb-2" required />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">Submit</button>
      </form>
      {msg && <div className="text-green-600 font-bold">{msg}</div>}
    </Layout>
  );
}

export default FacultyAddStudent;
