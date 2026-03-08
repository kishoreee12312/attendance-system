import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function StudentsData() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    year: "",
    className: ""
  });

  const fetchStudents = async () => {
    try {
      const res = await API.get("/admin/students");
      setStudents(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load students data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (studentId) => {
    try {
      await API.delete(`/students/${studentId}`);
      setStudents((prev) => prev.filter((s) => s._id !== studentId));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete student");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("/admin/create-student", {
        ...form,
        year: Number(form.year),
        className: form.className.trim().toUpperCase()
      });
      setForm({ name: "", email: "", password: "", department: "", year: "", className: "" });
      fetchStudents();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create student");
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Students Data</h2>

      <form className="glass-card p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreate}>
        <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Year" type="number" min="1" max="4" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Class (e.g. CSE-A)" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required />
        <div className="md:col-span-2">
          <button className="bg-teal-700 text-white px-4 py-2 rounded" type="submit">Create Student (Max 40 per class)</button>
        </div>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Department</th>
              <th className="border px-4 py-2">Year</th>
              <th className="border px-4 py-2">Class</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student._id}>
                <td className="border px-4 py-2">{student.name}</td>
                <td className="border px-4 py-2">{student.email}</td>
                <td className="border px-4 py-2">{student.department}</td>
                <td className="border px-4 py-2">{student.year}</td>
                <td className="border px-4 py-2">{student.className || "-"}</td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(student._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

export default StudentsData;
