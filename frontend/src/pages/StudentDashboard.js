import { useEffect, useMemo, useState } from "react";
import { Chart, BarElement, CategoryScale, LinearScale } from "chart.js";
import { Bar } from "react-chartjs-2";
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

  useEffect(() => {
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

    loadDashboard();
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
