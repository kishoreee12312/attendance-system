import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function AssignSubjects() {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [classNames, setClassNames] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [facultyRes, subjectsRes] = await Promise.all([
          API.get("/admin/faculty"),
          API.get("/subjects")
        ]);
        setFaculty(facultyRes.data);
        setSubjects(subjectsRes.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load assignment data");
      }
    };

    loadData();
  }, []);

  const handleAssign = e => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedFaculty || selectedSubjects.length === 0) {
      setError("Select faculty and at least one subject");
      return;
    }

    API.post("/subjects/assign-faculty", {
      subjectId: selectedSubjects,
      facultyIds: [selectedFaculty],
      classNames: classNames
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean)
    }).then(() => {
      setSelectedFaculty("");
      setSelectedSubjects([]);
      setClassNames("");
      setMessage("Subjects assigned successfully");
    }).catch((err) => {
      setError(err?.response?.data?.message || "Failed to assign subjects");
    });
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Assign Subjects to Faculty</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
      <form className="bg-white p-4 rounded shadow mb-6" onSubmit={handleAssign}>
        <div className="mb-2">
          <label className="block mb-1">Select Faculty:</label>
          <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)} className="border p-2 w-full" required>
            <option value="">-- Select Faculty --</option>
            {faculty.map(f => (
              <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Select Subjects:</label>
          <select multiple value={selectedSubjects} onChange={e => setSelectedSubjects(Array.from(e.target.selectedOptions, option => option.value))} className="border p-2 w-full" required>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Class Names (comma separated):</label>
          <input
            value={classNames}
            onChange={(e) => setClassNames(e.target.value)}
            className="border p-2 w-full"
            placeholder="CSE-A, CSE-B"
            required
          />
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">Assign</button>
      </form>
    </Layout>
  );
}

export default AssignSubjects;
