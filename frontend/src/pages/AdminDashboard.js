import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import Layout from "../components/Layout";
import API from "../services/api";

Chart.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const [chartData, setChartData] = useState(null);
  const [lowStudents, setLowStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [analyticsRes, lowRes] = await Promise.all([
          API.get("/attendance/admin-analytics"),
          API.get("/attendance/low-attendance")
        ]);

        setChartData({
          labels: ["Present", "Absent"],
          datasets: [
            {
              data: [
                analyticsRes.data.presentPercentage,
                analyticsRes.data.absentPercentage
              ],
              backgroundColor: ["#0f766e", "#ea580c"],
              borderWidth: 2,
              borderColor: "#fff"
            }
          ]
        });
        setLowStudents(lowRes.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-teal-700">Admin Analytics</p>
          <h1 className="page-title text-4xl font-black mt-2">Attendance Intelligence</h1>
          <div className="mt-4">
            <Link to="/admin/class-management" className="inline-block bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold">
              Open Class Management
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center text-slate-600">Loading admin dashboard...</div>
        ) : error ? (
          <div className="glass-card p-4 text-red-700">{error}</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-slate-800">Overall Attendance Split</h2>
              {chartData && (
                <Pie
                  data={chartData}
                  options={{
                    plugins: {
                      legend: {
                        labels: {
                          color: "#334155",
                          font: { size: 14, weight: "bold" }
                        }
                      },
                      title: {
                        display: true,
                        text: "Live Attendance Ratio",
                        color: "#1e293b",
                        font: { size: 18, weight: "bold" }
                      }
                    }
                  }}
                />
              )}
            </div>

            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-slate-800">Students Below 75%</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 rounded-l-lg">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3 rounded-r-lg">Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStudents.map((student, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="p-3 font-medium">{student.name}</td>
                        <td className="p-3 text-slate-600">{student.email}</td>
                        <td className="p-3 text-orange-600 font-bold">{student.percentage}%</td>
                      </tr>
                    ))}
                    {lowStudents.length === 0 && (
                      <tr>
                        <td className="p-3 text-slate-500" colSpan="3">No students are below threshold.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminDashboard;
