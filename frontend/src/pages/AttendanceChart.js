import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AttendanceChart() {
  const data = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        label: "Attendance",
        data: [80, 20],
        backgroundColor: ["green", "red"],
      },
    ],
  };

  return (
    <div style={{ width: "400px", margin: "auto" }}>
      <h3>Attendance Chart</h3>
      <Bar data={data} />
    </div>
  );
}

export default AttendanceChart;