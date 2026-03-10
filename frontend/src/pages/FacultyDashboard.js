import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import API from "../services/api";
import Layout from "../components/Layout";

Chart.register(ArcElement, Tooltip, Legend);

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
  const [reportScope, setReportScope] = useState("overall");
  const [reportClass, setReportClass] = useState("");
  const [reportStudentId, setReportStudentId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const reportPrintRef = useRef(null);

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

  useEffect(() => {
    const fetchReportData = async () => {
      setReportLoading(true);
      setReportError("");

      try {
        const params = { scope: reportScope };
        if (reportClass) {
          params.className = reportClass;
        }
        if (reportStudentId) {
          params.studentId = reportStudentId;
        }

        const res = await API.get("/attendance/faculty-report", { params });
        setReportData(res.data);

        if (!reportClass && res.data?.filters?.selectedClass) {
          setReportClass(res.data.filters.selectedClass);
        }
        if (!reportStudentId && res.data?.filters?.selectedStudentId) {
          setReportStudentId(res.data.filters.selectedStudentId);
        }
      } catch (error) {
        setReportError(error?.response?.data?.message || "Failed to load report data");
      } finally {
        setReportLoading(false);
      }
    };

    fetchReportData();
  }, [reportScope, reportClass, reportStudentId]);

  const reportStudents = useMemo(() => reportData?.filters?.students || [], [reportData]);

  const reportChartData = useMemo(() => {
    if (!reportData?.summary) {
      return null;
    }

    return {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [reportData.summary.presentPercentage, reportData.summary.absentPercentage],
          backgroundColor: ["#0f766e", "#ea580c"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }
      ]
    };
  }, [reportData]);

  const downloadReportPdf = () => {
    const reportNode = reportPrintRef.current;
    if (!reportNode || !reportData?.summary) {
      setModalMsg("Report is not ready to export yet.");
      setShowModal(true);
      return;
    }

    const chartCanvas = reportNode.querySelector("canvas");
    const chartImage = chartCanvas ? chartCanvas.toDataURL("image/png") : "";
    const reportWindow = window.open("", "_blank", "width=900,height=700");

    if (!reportWindow) {
      setModalMsg("Popup blocked. Allow popups to export the report as PDF.");
      setShowModal(true);
      return;
    }

    const generatedAt = new Date().toLocaleString();
    reportWindow.document.write(`
      <html>
        <head>
          <title>Faculty Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1 { margin-bottom: 8px; }
            p { margin: 6px 0; }
            .meta { color: #475569; margin-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }
            .card strong { display: block; font-size: 24px; margin-top: 6px; }
            img { max-width: 420px; display: block; margin: 24px auto; }
          </style>
        </head>
        <body>
          <h1>${reportData.summary.label}</h1>
          <p class="meta">Generated on ${generatedAt}</p>
          <div class="summary">
            <div class="card"><p>Total Records</p><strong>${reportData.summary.totalRecords}</strong></div>
            <div class="card"><p>Present</p><strong>${reportData.summary.presentRecords}</strong></div>
            <div class="card"><p>Absent</p><strong>${reportData.summary.absentRecords}</strong></div>
            <div class="card"><p>Attendance</p><strong>${reportData.summary.presentPercentage}%</strong></div>
          </div>
          ${chartImage ? `<img src="${chartImage}" alt="Attendance report chart" />` : ""}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

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
          <button
            className={`px-6 py-2.5 rounded-xl font-semibold transition ${activeTab === "reports" ? "bg-teal-700 text-white" : "text-slate-700"}`}
            onClick={() => setActiveTab("reports")}
          >
            Reports
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

            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Report Scope</label>
                      <select
                        className="border border-slate-200 p-2.5 rounded-xl bg-white min-w-48"
                        value={reportScope}
                        onChange={(e) => {
                          const nextScope = e.target.value;
                          setReportScope(nextScope);
                          if (nextScope === "overall") {
                            setReportClass("");
                            setReportStudentId("");
                          } else if (nextScope === "class") {
                            setReportStudentId("");
                          }
                        }}
                      >
                        <option value="overall">Overall</option>
                        <option value="class">Particular Class</option>
                        <option value="student">Particular Student</option>
                      </select>
                    </div>

                    {(reportScope === "class" || reportScope === "student") && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
                        <select
                          className="border border-slate-200 p-2.5 rounded-xl bg-white min-w-48"
                          value={reportClass}
                          onChange={(e) => {
                            setReportClass(e.target.value);
                            setReportStudentId("");
                          }}
                        >
                          <option value="">Choose Class</option>
                          {(reportData?.filters?.classes || []).map((className) => (
                            <option key={className} value={className}>
                              {className}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {reportScope === "student" && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Student</label>
                        <select
                          className="border border-slate-200 p-2.5 rounded-xl bg-white min-w-72"
                          value={reportStudentId}
                          onChange={(e) => setReportStudentId(e.target.value)}
                        >
                          <option value="">Choose Student</option>
                          {reportStudents.map((student) => (
                            <option key={student._id} value={student._id}>
                              {student.name} ({student.className})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                      onClick={downloadReportPdf}
                      disabled={reportLoading || !reportData?.summary}
                    >
                      Download PDF
                    </button>
                  </div>
                </div>

                {reportLoading ? (
                  <div className="glass-card p-8 text-center text-slate-600">Loading report...</div>
                ) : reportError ? (
                  <div className="glass-card p-6 text-rose-700">{reportError}</div>
                ) : (
                  <div ref={reportPrintRef} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                      <h3 className="text-2xl font-bold mb-4 text-slate-800">{reportData?.summary?.label || "Attendance report"}</h3>
                      {reportChartData && (
                        <Pie
                          data={reportChartData}
                          options={{
                            plugins: {
                              legend: {
                                labels: {
                                  color: "#334155",
                                  font: { size: 14, weight: "bold" }
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="text-2xl font-bold mb-4 text-slate-800">Report Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">Total Records</p>
                          <p className="text-3xl font-black text-slate-800 mt-1">{reportData?.summary?.totalRecords ?? 0}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 p-4">
                          <p className="text-sm text-emerald-700">Present</p>
                          <p className="text-3xl font-black text-emerald-800 mt-1">{reportData?.summary?.presentRecords ?? 0}</p>
                        </div>
                        <div className="rounded-2xl bg-orange-50 p-4">
                          <p className="text-sm text-orange-700">Absent</p>
                          <p className="text-3xl font-black text-orange-800 mt-1">{reportData?.summary?.absentRecords ?? 0}</p>
                        </div>
                        <div className="rounded-2xl bg-teal-50 p-4">
                          <p className="text-sm text-teal-700">Attendance</p>
                          <p className="text-3xl font-black text-teal-800 mt-1">{reportData?.summary?.presentPercentage ?? 0}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
