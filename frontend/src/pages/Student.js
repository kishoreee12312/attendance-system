import { useEffect, useState } from "react";
import API from "../services/api";

function Students() {

  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const loadStudents = async () => {
    const res = await API.get("/students");
    setStudents(res.data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const addStudent = async () => {

    await API.post("/students", {
      name,
      email,
      password: "123456",
      department: "CSE"
    });

    loadStudents();
  };

  const deleteStudent = async (id) => {
    await API.delete("/students/" + id);
    loadStudents();
  };

  return (
    <div>

      <h2>Students</h2>

      <input
        placeholder="Student Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Student Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={addStudent}>Add Student</button>

      <ul>
        {students.map((s) => (
          <li key={s._id}>
            {s.name}
            <button onClick={() => deleteStudent(s._id)}>Delete</button>
          </li>
        ))}
      </ul>

    </div>
  );
}

export default Students;