import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });
  const [error, setError] = useState("");

  const fetchSubjects = async () => {
    try {
      const res = await API.get("/subjects");
      setSubjects(res.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = e => {
    e.preventDefault();
    API.post("/subjects", form)
      .then(() => {
        setShowForm(false);
        setForm({ name: "", code: "" });
        return fetchSubjects();
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to create subject");
      });
  };

  const handleDelete = async (subjectId) => {
    try {
      await API.delete(`/subjects/${subjectId}`);
      setSubjects((prev) => prev.filter((s) => s._id !== subjectId));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete subject");
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Subjects</h2>
      <button className="bg-green-500 text-white px-4 py-2 rounded mb-4" onClick={() => setShowForm(true)}>
        Create Subject
      </button>
      {showForm && (
        <form className="mb-6 bg-white p-4 rounded shadow" onSubmit={handleCreate}>
          <div className="mb-2">
            <input name="name" value={form.name} onChange={handleInput} placeholder="Subject Name" className="border p-2 w-full" required />
          </div>
          <div className="mb-2">
            <input name="code" value={form.code} onChange={handleInput} placeholder="Subject Code" className="border p-2 w-full" required />
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
              <th className="border px-4 py-2">Code</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(subject => (
              <tr key={subject._id}>
                <td className="border px-4 py-2">{subject.name}</td>
                <td className="border px-4 py-2">{subject.code}</td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(subject._id)}
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

export default Subjects;
