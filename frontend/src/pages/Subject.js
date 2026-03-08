import { useEffect, useState } from "react";
import API from "../services/api";

function Subjects() {

  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");

  const loadSubjects = async () => {
    const res = await API.get("/subjects");
    setSubjects(res.data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const addSubject = async () => {

    await API.post("/subjects", {
      subjectName: name
    });

    loadSubjects();
  };

  const deleteSubject = async (id) => {
    await API.delete("/subjects/" + id);
    loadSubjects();
  };

  return (
    <div>

      <h2>Subjects</h2>

      <input
        placeholder="Subject Name"
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={addSubject}>Add Subject</button>

      <ul>
        {subjects.map((s) => (
          <li key={s._id}>
            {s.subjectName}
            <button onClick={() => deleteSubject(s._id)}>Delete</button>
          </li>
        ))}
      </ul>

    </div>
  );
}

export default Subjects;