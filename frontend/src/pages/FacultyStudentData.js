import React, { useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function FacultyStudentData() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", year: "", subject: "" });
  const [msg, setMsg] = useState("");
  const [subjects, setSubjects] = useState([]);

  React.useEffect(() => {
    API.get("/students").then(res => setStudents(res.data));
    API.get("/subjects").then(res => setSubjects(res.data));
  }, []);

  const handleInput = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = e => {
    e.preventDefault();
    API.post("/students/create", form)
      .then(() => {
        setMsg("Student created successfully!");
        setForm({ name: "", email: "", password: "", department: "", year: "", subject: "" });
        API.get("/students").then(res => setStudents(res.data));
      })
      .catch(() => setMsg("Error creating student."));
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Student Data</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
        <form onSubmit={handleCreate}>
          <input name="name" value={form.name} onChange={handleInput} placeholder="Name" className="border p-2 w-full mb-2" required />
          <input name="email" value={form.email} onChange={handleInput} placeholder="Email" className="border p-2 w-full mb-2" required />
          <input name="password" value={form.password} onChange={handleInput} placeholder="Password" className="border p-2 w-full mb-2" required />
          <input name="department" value={form.department} onChange={handleInput} placeholder="Department" className="border p-2 w-full mb-2" required />
          <input name="year" value={form.year} onChange={handleInput} placeholder="Year" className="border p-2 w-full mb-2" required />
          <select name="subject" value={form.subject} onChange={handleInput} className="border p-2 w-full mb-2" required>
            <option value="">Select Class/Subject</option>
            {subjects.map(sub => (
              <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
            ))}
          </select>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" type="submit">Add Student</button>
        </form>
        {msg && <div className="text-green-600 font-bold mt-2">{msg}</div>}
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Existing Students</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Department</th>
              <th className="p-3">Year</th>
              <th className="p-3">Class/Subject</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student._id} className="border-b hover:bg-gray-100">
                <td className="p-3">{student.name}</td>
                <td className="p-3">{student.email}</td>
                <td className="p-3">{student.department}</td>
                <td className="p-3">{student.year}</td>
                <td className="p-3">
                  {(student.subjects || [])
                    .map((sub) => (typeof sub === "string" ? subjects.find((s) => s._id === sub) : sub))
                    .filter(Boolean)
                    .map((sub) => `${sub.name}${sub.code ? ` (${sub.code})` : ""}`)
                    .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default FacultyStudentData;
