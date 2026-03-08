/* eslint-disable no-console */
const BASE_URL = process.env.BASE_URL || "http://localhost:5000/api";

const request = async (path, { method = "GET", token, body } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
};

const expectStatus = async (name, promiseFactory, allowedStatuses) => {
  try {
    const result = await promiseFactory();
    const ok = allowedStatuses.includes(result.status);
    console.log(`${ok ? "PASS" : "FAIL"} - ${name} -> ${result.status}`);
    if (!ok) {
      console.log("  Response:", result.data);
    }
    return { ok, ...result };
  } catch (error) {
    console.log(`FAIL - ${name} -> exception`);
    console.log("  Error:", error.message || error);
    return { ok: false, status: 0, data: { message: error.message } };
  }
};

(async () => {
  const runId = Date.now();
  const tempSubjectCode = `TMP${runId}`;
  const tempStudentEmail = `student.${runId}@example.com`;

  let tempSubjectId = null;
  let tempStudentId = null;

  let adminToken = null;
  let facultyToken = null;
  let studentToken = null;

  let total = 0;
  let passed = 0;

  const track = async (name, fn, statuses) => {
    total += 1;
    const result = await expectStatus(name, fn, statuses);
    if (result.ok) passed += 1;
    return result;
  };

  console.log(`Running smoke test against ${BASE_URL}`);

  const adminLogin = await track(
    "Admin login",
    () => request("/auth/login", {
      method: "POST",
      body: { email: "admin@attendance.com", password: "admin123" }
    }),
    [200]
  );
  adminToken = adminLogin.data?.token;

  const facultyLogin = await track(
    "Faculty login",
    () => request("/auth/login", {
      method: "POST",
      body: { email: "faculty@attendance.com", password: "faculty123" }
    }),
    [200]
  );
  facultyToken = facultyLogin.data?.token;

  if (!adminToken || !facultyToken) {
    console.log("Critical login failed. Aborting remaining checks.");
    process.exit(1);
  }

  await track("Admin can fetch students", () => request("/admin/students", { token: adminToken }), [200]);
  await track("Faculty denied admin students", () => request("/admin/students", { token: facultyToken }), [403]);

  const createSubject = await track(
    "Admin create subject",
    () => request("/subjects", {
      method: "POST",
      token: adminToken,
      body: { name: `Temp Subject ${runId}`, code: tempSubjectCode }
    }),
    [201]
  );
  tempSubjectId = createSubject.data?._id;

  if (tempSubjectId) {
    await track(
      "Admin assign subject to faculty",
      () => request("/subjects/assign-faculty", {
        method: "POST",
        token: adminToken,
        body: { subjectId: [tempSubjectId], facultyIds: [facultyLogin.data._id] }
      }),
      [200]
    );
  }

  const createStudent = await track(
    "Faculty create student",
    () => request("/students/create", {
      method: "POST",
      token: facultyToken,
      body: {
        name: `Temp Student ${runId}`,
        email: tempStudentEmail,
        password: "student123",
        department: "Science",
        year: 1,
        subject: tempSubjectId
      }
    }),
    [201]
  );
  tempStudentId = createStudent.data?._id;

  const studentLogin = await track(
    "Temp student login",
    () => request("/auth/login", {
      method: "POST",
      body: { email: tempStudentEmail, password: "student123" }
    }),
    [200]
  );
  studentToken = studentLogin.data?.token;

  if (studentToken) {
    await track("Student denied admin students", () => request("/admin/students", { token: studentToken }), [403]);
    await track("Student fetch subjectwise attendance", () => request("/attendance/subjectwise", { token: studentToken }), [200]);
    await track("Student denied admin analytics", () => request("/attendance/admin-analytics", { token: studentToken }), [403]);
  }

  if (tempSubjectId && tempStudentId) {
    await track(
      "Faculty mark attendance",
      () => request("/attendance/mark", {
        method: "POST",
        token: facultyToken,
        body: {
          subjectId: tempSubjectId,
          date: new Date().toISOString(),
          records: [{ studentId: tempStudentId, status: "Present" }]
        }
      }),
      [200, 400]
    );
  }

  await track("Admin fetch faculty", () => request("/admin/faculty", { token: adminToken }), [200]);
  await track("Admin fetch subjects", () => request("/subjects", { token: adminToken }), [200]);

  if (tempStudentId) {
    await track("Admin delete temp student", () => request(`/students/${tempStudentId}`, {
      method: "DELETE",
      token: adminToken
    }), [200]);
  }

  if (tempSubjectId) {
    await track("Admin delete temp subject", () => request(`/subjects/${tempSubjectId}`, {
      method: "DELETE",
      token: adminToken
    }), [200]);
  }

  console.log(`\nSummary: ${passed}/${total} checks passed.`);
  if (passed !== total) {
    process.exit(1);
  }
})();
