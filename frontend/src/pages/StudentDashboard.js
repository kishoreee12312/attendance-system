import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Html5Qrcode } from "html5-qrcode";
import Layout from "../components/Layout";
import API from "../services/api";

Chart.register(BarElement, CategoryScale, LinearScale);

function StudentDashboard() {
  const [data, setData] = useState(null);
  const [lowAttendance, setLowAttendance] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [percentages, setPercentages] = useState([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const scannerRef = useRef(null);
  const scannerRunningRef = useRef(false);
  const scannerSectionRef = useRef(null);

  const loadDashboard = async () => {
    try {
      const res = await API.get("/attendance/subjectwise");
      const labels = res.data.map((item) => item.subject);
      const currentPercentages = res.data.map((item) => Number(item.percentage));

      setData({
        labels,
        datasets: [
          {
            label: "Attendance %",
            data: currentPercentages,
            backgroundColor: ["#0f766e", "#ea580c", "#0ea5e9", "#16a34a", "#f59e0b"],
            borderRadius: 10,
            borderWidth: 0
          }
        ]
      });

      setPercentages(currentPercentages);
      setLowAttendance(currentPercentages.some((p) => p < 75));
    } catch (error) {
      setModalMsg(error?.response?.data?.message || "Failed to load attendance data");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stopScanner = async () => {
    if (!scannerRef.current) {
      scannerRunningRef.current = false;
      return;
    }

    try {
      if (scannerRunningRef.current) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch (error) {
      // Ignore stop/clear errors to keep UI stable on mobile browsers.
    } finally {
      scannerRef.current = null;
      scannerRunningRef.current = false;
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      let token = decodedText;
      try {
        const parsed = JSON.parse(decodedText);
        token = parsed?.token || decodedText;
      } catch (parseError) {
        token = decodedText;
      }

      await API.post("/attendance/scan-qr", { token });
      setModalMsg("Attendance marked successfully.");
      await loadDashboard();
    } catch (error) {
      setModalMsg(error?.response?.data?.message || "Invalid or expired QR.");
    } finally {
      await stopScanner();
      setScannerActive(false);
      setShowModal(true);
    }
  };

  const startScanner = async () => {
    setScannerError("");
    await stopScanner();

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setScannerError("No camera found on this device.");
        return;
      }

      const preferredCamera = cameras.find((camera) =>
        /back|rear|environment/i.test(camera.label || "")
      ) || cameras[0];

      const scanner = new Html5Qrcode("student-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        preferredCamera.id,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1
        },
        handleScanSuccess,
        () => {}
      );
      scannerRunningRef.current = true;
      setScannerActive(true);
    } catch (error) {
      await stopScanner();
      setScannerActive(false);
      setScannerError(
        "Camera could not start. Allow camera permission and close other apps using camera."
      );
    }
  };

  useEffect(() => () => {
    stopScanner();
  }, []);

  const overallPerformance = useMemo(() => {
    if (!percentages.length) {
      return 0;
    }
    const total = percentages.reduce((sum, value) => sum + value, 0);
    return Number((total / percentages.length).toFixed(2));
  }, [percentages]);

  const performanceLabel = overallPerformance >= 85
    ? "Excellent"
    : overallPerformance >= 75
      ? "Good"
      : "Needs Improvement";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-teal-700">Student Overview</p>
            <h2 className="page-title text-4xl font-black mt-2">My Attendance Profile</h2>
            <button
              className="mt-4 bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold"
              onClick={async () => {
                scannerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                await startScanner();
              }}
            >
              Open QR Scanner
            </button>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-500">Performance</p>
              <span className={`text-xs px-2 py-1 rounded-full ${lowAttendance ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>
                {performanceLabel}
              </span>
            </div>
            <p className="text-3xl font-black text-slate-800">{overallPerformance}%</p>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-sm font-semibold text-slate-500">Notification</p>
              <p className={`text-sm mt-1 ${lowAttendance ? "text-orange-700" : "text-emerald-700"}`}>
                {lowAttendance
                  ? "Low attendance alert in at least one subject."
                  : "Great consistency. Keep this momentum."}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center text-slate-600">Loading attendance...</div>
        ) : (
          <>
            {lowAttendance && (
              <div className="glass-card p-4 mb-6 border border-orange-200 text-orange-700 font-semibold">
                Warning: Your attendance is below 75% in one or more subjects.
              </div>
            )}
            {data && (
              <div className="glass-card p-6">
                <Bar
                  data={data}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: true,
                        labels: {
                          color: "#334155",
                          font: { size: 14, weight: "bold" }
                        }
                      },
                      title: {
                        display: true,
                        text: "Attendance by Subject",
                        color: "#1e293b",
                        font: { size: 20, weight: "bold" }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          color: "#1e293b"
                        },
                        grid: {
                          color: "rgba(30, 41, 59, 0.1)"
                        }
                      },
                      x: {
                        ticks: {
                          color: "#1e293b"
                        },
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
            <div ref={scannerSectionRef} className="glass-card p-6 mt-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold text-slate-800">QR Attendance</h3>
                {!scannerActive ? (
                  <button
                    className="bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold"
                    onClick={startScanner}
                  >
                    Start QR Scan
                  </button>
                ) : (
                  <button
                    className="bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold"
                    onClick={async () => {
                      await stopScanner();
                      setScannerActive(false);
                    }}
                  >
                    Stop Scan
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Scan the faculty QR within 2 minutes to mark attendance for your account.
              </p>
              {scannerError && (
                <p className="text-sm text-rose-600 font-medium mb-3">{scannerError}</p>
              )}
              <div id="student-qr-reader" className="w-full max-w-md" />
            </div>
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-50 px-4">
            <div className="glass-card p-6 w-full max-w-md">
              <p className="text-lg mb-4 font-medium">{modalMsg}</p>
              <button className="bg-teal-700 text-white px-4 py-2 rounded-lg" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default StudentDashboard;
