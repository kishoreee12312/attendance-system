import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classSubjectMap, setClassSubjectMap] = useState({});
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [attendance, setAttendance] = useState({});
  const [qrImage, setQrImage] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("class");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, studentRes] = await Promise.all([
          API.get("/subjects/faculty-classes"),
          API.get("/students")
        ]);

        setAvailableClasses(classRes.data.classes || []);
        setClassSubjectMap(classRes.data.byClass || {});
        setStudents(studentRes.data);
      } catch (error) {
        setModalMsg(error?.response?.data?.message || "Error loading dashboard data");
        setShowModal(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedClassSubject = useMemo(() => {
    const subjects = classSubjectMap[selectedClass] || [];
    return subjects.length ? subjects[0] : null;
  }, [classSubjectMap, selectedClass]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    return students.filter((student) => (student.className || "") === selectedClass);
  }, [selectedClass, students]);

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const submitAttendance = async () => {
    if (!selectedClass) {
      setModalMsg("Please select a class first.");
      setShowModal(true);
      return;
    }
    if (!selectedPeriod) {
      setModalMsg("Please select a period (1-5) first.");
      setShowModal(true);
      return;
    }

    const records = filteredStudents.map((student) => ({
      studentId: student._id,
      status: attendance[student._id] || "Absent"
    }));

    if (records.length === 0) {
      setModalMsg("No students found in this class.");
      setShowModal(true);
      return;
    }

    try {
      await API.post("/attendance/mark", {
        className: selectedClass,
        subjectId: selectedClassSubject?.subjectId || selectedClassSubject?._id,
        period: Number(selectedPeriod),
        date: new Date(),
        records
      });
      setModalMsg(`Attendance marked successfully for ${selectedClass}, period ${selectedPeriod}.`);
      setAttendance({});
    } catch (error) {
      setModalMsg(error?.response?.data?.message || "Error marking attendance.");
    }

    setShowModal(true);
  };

  const generateQR = async () => {
    if (!selectedClass || !selectedClassSubject) {
      setModalMsg("Select a class first.");
      setShowModal(true);
      return;
    }
    if (!selectedPeriod) {
      setModalMsg("Select a period (1-5) first.");
      setShowModal(true);
      return;
    }

    try {
      const res = await API.post("/attendance/generate-qr", {
        subjectId: selectedClassSubject.subjectId || selectedClassSubject._id,
        className: selectedClass,
        period: Number(selectedPeriod)
      });
      setQrImage(res.data.qrImage);
      setQrExpiresAt(res.data.expiresAt || null);
      setModalMsg(`QR generated for ${selectedClass}, period ${selectedPeriod}. Expires in 2 minutes.`);
    } catch (error) {
      setModalMsg(error?.response?.data?.message || "Error generating QR code.");
    }

    setShowModal(true);
  };

  useEffect(() => {
    if (!qrExpiresAt) {
      setQrSecondsLeft(0);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(qrExpiresAt).getTime() - Date.now()) / 1000));
      setQrSecondsLeft(diff);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [qrExpiresAt]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-teal-700">Faculty Workspace</p>
          <h2 className="page-title text-4xl font-black mt-2">Daily Attendance Desk</h2>
        </div>

        <div className="glass-card p-2 mb-8 inline-flex gap-2">
          <button
            className={`px-6 py-2.5 rounded-xl font-semibold transition ${activeTab === "class" ? "bg-teal-700 text-white" : "text-slate-700"}`}
            onClick={() => setActiveTab("class")}
          >
            Class Control
          </button>
          <button
            className={`px-6 py-2.5 rounded-xl font-semibold transition ${activeTab === "management" ? "bg-teal-700 text-white" : "text-slate-700"}`}
            onClick={() => setActiveTab("management")}
          >
            Class Management
          </button>
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center text-slate-600">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === "class" && (
              <>
                <div className="glass-card p-5 mb-6 flex flex-wrap items-center gap-3">
                  <label className="font-semibold text-slate-700">Select Class</label>
                  <select
                    className="border border-slate-200 p-2.5 rounded-xl bg-white min-w-56"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value.toUpperCase())}
                  >
                    <option value="">Choose Class</option>
                    {availableClasses.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>

                  <label className="font-semibold text-slate-700 ml-2">Period</label>
                  <select
                    className="border border-slate-200 p-2.5 rounded-xl bg-white min-w-36"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    <option value="">Choose Period</option>
                    {[1, 2, 3, 4, 5].map((period) => (
                      <option key={period} value={period}>
                        Period {period}
                      </option>
                    ))}
                  </select>

                  {selectedClassSubject && (
                    <span className="text-sm text-slate-500">Subject: {selectedClassSubject.subjectName} ({selectedClassSubject.subjectCode})</span>
                  )}
                </div>

                {selectedClass && selectedPeriod && (
                  <div className="glass-card p-6 mb-8 overflow-hidden">
                    <h3 className="text-2xl font-bold mb-4 text-slate-800">Mark Attendance ({selectedClass}, Period {selectedPeriod})</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="p-3 rounded-l-lg">Student</th>
                            <th className="p-3">Present</th>
                            <th className="p-3 rounded-r-lg">Absent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr key={student._id} className="border-b border-slate-100">
                              <td className="p-3 font-medium">{student.name}</td>
                              <td className="p-3">
                                <button
                                  className={`px-4 py-1.5 rounded-lg font-semibold ${attendance[student._id] === "Present" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"}`}
                                  onClick={() => handleStatusChange(student._id, "Present")}
                                >
                                  Present
                                </button>
                              </td>
                              <td className="p-3">
                                <button
                                  className={`px-4 py-1.5 rounded-lg font-semibold ${attendance[student._id] === "Absent" ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-700"}`}
                                  onClick={() => handleStatusChange(student._id, "Absent")}
                                >
                                  Absent
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button className="mt-6 bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-xl font-semibold transition" onClick={submitAttendance}>
                      Submit Attendance
                    </button>
                  </div>
                )}

                {selectedClass && selectedClassSubject && (
                  <div className="glass-card p-6">
                    <h3 className="text-2xl font-bold mb-4 text-slate-800">Quick QR</h3>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition" onClick={generateQR}>
                      Generate QR
                    </button>
                    {qrImage && (
                      <div className="mt-5 flex justify-center">
                        <div className="text-center">
                          <img src={qrImage} alt="QR Code" width="210" className="rounded-xl border border-slate-100 shadow" />
                          <p className={`mt-3 text-sm font-semibold ${qrSecondsLeft > 0 ? "text-teal-700" : "text-rose-600"}`}>
                            {qrSecondsLeft > 0
                              ? `Expires in ${String(Math.floor(qrSecondsLeft / 60)).padStart(2, "0")}:${String(qrSecondsLeft % 60).padStart(2, "0")}`
                              : "QR expired. Generate again."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "management" && (
              <div className="glass-card p-8">
                <p className="text-slate-600 mb-4">View class seat usage, class attendance summary, and student-wise attendance percentages.</p>
                <Link
                  to="/faculty/class-management"
                  className="inline-block bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  Open Class Management
                </Link>
              </div>
            )}
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-50 px-4">
            <div className="glass-card p-6 max-w-md w-full">
              <p className="text-lg mb-4 font-medium text-slate-800">{modalMsg}</p>
              <button className="bg-teal-700 text-white px-4 py-2 rounded-lg" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default FacultyDashboard;
