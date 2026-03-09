import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

function ClassManagement() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", capacity: 40 });

  const loadData = useCallback(async (className = "") => {
    try {
      setLoading(true);
      setError("");
      const classQuery = className ? `?className=${encodeURIComponent(className)}` : "";
      const [managementRes, classListRes] = await Promise.all([
        API.get(`/attendance/class-management${classQuery}`),
        isAdmin ? API.get("/admin/classes") : Promise.resolve({ data: [] })
      ]);

      setClasses(managementRes.data.classes || []);
      setSelectedClass(managementRes.data.selectedClass || "");
      setSummary(managementRes.data.classSummary || null);
      setStudents(managementRes.data.students || []);

      if (isAdmin && classListRes.data?.length) {
        // Keep backend summary source as primary; class list is available for future use.
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load class management data");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClassChange = async (value) => {
    setSelectedClass(value);
    await loadData(value);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setError("");
    setMessage("");

    try {
      await API.post("/admin/classes", {
        name: form.name.trim().toUpperCase(),
        capacity: Number(form.capacity || 40)
      });
      setMessage("Class created successfully.");
      setForm({ name: "", capacity: 40 });
      await loadData(form.name.trim().toUpperCase());
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create class");
    }
  };

  const handleDeleteClass = async () => {
    if (!isAdmin || !selectedClass) return;

    const confirmed = window.confirm(
      `Delete class ${selectedClass}? This works only when no students, attendance, or subject assignment exists.`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await API.delete(`/admin/classes/${encodeURIComponent(selectedClass)}`);
      setMessage(`Class ${selectedClass} deleted successfully.`);
      await loadData("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete class");
    }
  };

  const averageStudentAttendance = useMemo(() => {
    if (!students.length) return 0;
    const sum = students.reduce((acc, student) => acc + (student.attendancePercentage || 0), 0);
    return Number((sum / students.length).toFixed(2));
  }, [students]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-teal-700">
            {isAdmin ? "Admin" : "Faculty"} Class Management
          </p>
          <h1 className="page-title text-4xl font-black mt-2">Class Dashboard</h1>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}

        {isAdmin && (
          <form className="glass-card p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreateClass}>
            <input
              className="border p-2 rounded-xl"
              placeholder="Class Name (e.g. CSE-A)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="border p-2 rounded-xl"
              type="number"
              min="1"
              max="40"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
            <div className="md:col-span-2">
              <button className="bg-teal-700 text-white px-4 py-2 rounded-xl" type="submit">
                Create Class
              </button>
            </div>
          </form>
        )}

        <div className="glass-card p-5 mb-6 flex flex-wrap items-center gap-3">
          <label className="font-semibold text-slate-700">Select Class</label>
          <select
            className="border border-slate-200 p-2.5 rounded-xl bg-white min-w-56"
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="">Choose Class</option>
            {classes.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
          {isAdmin && (
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-white ${selectedClass ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-300 cursor-not-allowed"}`}
              onClick={handleDeleteClass}
              disabled={!selectedClass}
            >
              Delete Class
            </button>
          )}
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center text-slate-600">Loading class data...</div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4">
                <p className="text-sm text-slate-500">Seat Usage</p>
                <p className="text-2xl font-black text-slate-800">{summary.seatUsage}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-slate-500">Class Attendance</p>
                <p className="text-2xl font-black text-slate-800">{summary.classAttendancePercentage}%</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-slate-500">Present Records</p>
                <p className="text-2xl font-black text-emerald-700">{summary.presentRecords}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-sm text-slate-500">Avg Student %</p>
                <p className="text-2xl font-black text-orange-600">{averageStudentAttendance}%</p>
              </div>
            </div>

            <div className="glass-card p-6 overflow-x-auto">
              <h3 className="text-2xl font-bold mb-4 text-slate-800">
                Students in {summary.className}
              </h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 rounded-l-lg">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Present/Total</th>
                    <th className="p-3 rounded-r-lg">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id} className="border-b border-slate-100">
                      <td className="p-3 font-medium">{student.name}</td>
                      <td className="p-3 text-slate-600">{student.email}</td>
                      <td className="p-3">{student.department}</td>
                      <td className="p-3">{student.year}</td>
                      <td className="p-3">{student.presentCount}/{student.totalClasses}</td>
                      <td className="p-3 font-semibold">{student.attendancePercentage}%</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td className="p-3 text-slate-500" colSpan="6">No students in this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="glass-card p-8 text-slate-600">No class data available.</div>
        )}
      </div>
    </Layout>
  );
}

export default ClassManagement;
