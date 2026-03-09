import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [unassigningKey, setUnassigningKey] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [facultyRes, subjectsRes] = await Promise.all([
        API.get("/admin/faculty"),
        API.get("/subjects")
      ]);
      setFaculty(facultyRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load assignment data");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const facultyMap = useMemo(() => {
    const map = new Map();
    faculty.forEach((member) => {
      map.set(String(member._id), member);
    });
    return map;
  }, [faculty]);

  const subjectAssignments = useMemo(() => (
    subjects.map((subject) => {
      const assignedFaculty = (subject.faculty || [])
        .map((id) => facultyMap.get(String(id)))
        .filter(Boolean);
      return {
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        classNames: subject.classNames || [],
        assignedFaculty
      };
    })
  ), [subjects, facultyMap]);

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
    }).then(async () => {
      setSelectedFaculty("");
      setSelectedSubjects([]);
      setClassNames("");
      setMessage("Subjects assigned successfully");
      await loadData();
    }).catch((err) => {
      setError(err?.response?.data?.message || "Failed to assign subjects");
    });
  };

  const handleUnassign = async (subjectId, facultyId) => {
    setError("");
    setMessage("");
    const key = `${subjectId}:${facultyId}`;
    setUnassigningKey(key);

    try {
      await API.post("/subjects/unassign-faculty", { subjectId, facultyId });
      setMessage("Staff unassigned successfully");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to unassign staff");
    } finally {
      setUnassigningKey("");
    }
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

      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-bold mb-4">Assigned Subject List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3">Subject</th>
                <th className="p-3">Code</th>
                <th className="p-3">Classes</th>
                <th className="p-3">Assigned Staff</th>
              </tr>
            </thead>
            <tbody>
              {subjectAssignments.map((item) => (
                <tr key={item._id} className="border-b">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3">{item.code}</td>
                  <td className="p-3">{item.classNames.length ? item.classNames.join(", ") : "-"}</td>
                  <td className="p-3">
                    {item.assignedFaculty.length ? (
                      <div className="space-y-2">
                        {item.assignedFaculty.map((member) => {
                          const key = `${item._id}:${member._id}`;
                          const isBusy = unassigningKey === key;
                          return (
                            <div key={key} className="flex flex-wrap items-center gap-2">
                              <span>{member.name} ({member.email})</span>
                              <button
                                type="button"
                                className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-sm"
                                onClick={() => handleUnassign(item._id, member._id)}
                                disabled={isBusy}
                              >
                                {isBusy ? "Unassigning..." : "Unassign"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : "Not assigned"}
                  </td>
                </tr>
              ))}
              {subjectAssignments.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-500" colSpan="4">No subjects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default AssignSubjects;
