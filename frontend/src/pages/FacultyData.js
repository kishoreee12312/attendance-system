import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function FacultyData() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "" });
  const [error, setError] = useState("");

  const fetchFaculty = async () => {
    try {
      const res = await API.get("/admin/faculty");
      setFaculty(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load faculty data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = e => {
    e.preventDefault();
    API.post("/admin/create-faculty", form)
      .then(() => {
        setShowForm(false);
        setForm({ name: "", email: "", password: "", department: "" });
        return fetchFaculty();
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to create faculty");
      });
  };

  const handleDelete = async (facultyId) => {
    try {
      await API.delete(`/admin/faculty/${facultyId}`);
      setFaculty((prev) => prev.filter((f) => f._id !== facultyId));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete faculty");
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Faculty Data</h2>
      <button className="bg-green-500 text-white px-4 py-2 rounded mb-4" onClick={() => setShowForm(true)}>
        Create Faculty
      </button>
      {showForm && (
        <form className="mb-6 bg-white p-4 rounded shadow" onSubmit={handleCreate}>
          <div className="mb-2">
            <input name="name" value={form.name} onChange={handleInput} placeholder="Name" className="border p-2 w-full" required />
          </div>
          <div className="mb-2">
            <input name="email" value={form.email} onChange={handleInput} placeholder="Email" className="border p-2 w-full" required />
          </div>
          <div className="mb-2">
            <input name="password" value={form.password} onChange={handleInput} placeholder="Password" className="border p-2 w-full" required />
          </div>
          <div className="mb-2">
            <input name="department" value={form.department} onChange={handleInput} placeholder="Department" className="border p-2 w-full" required />
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">Submit</button>
          <button className="ml-2 bg-gray-400 text-white px-4 py-2 rounded" type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Department</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map(member => (
              <tr key={member._id}>
                <td className="border px-4 py-2">{member.name}</td>
                <td className="border px-4 py-2">{member.email}</td>
                <td className="border px-4 py-2">{member.department}</td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(member._id)}
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

export default FacultyData;
