import dotenv from "dotenv";
dotenv.config();

async function runRbacTests() {
  console.log("====================================================");
  console.log("  ENGHUB INTEGRATION & RBAC SECURITY PROOF RUNNER  ");
  console.log("====================================================\n");

  const BASE_URL = "http://localhost:3000";
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName} ${detail ? `(${detail})` : ""}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ❌ ${testName} ${detail ? `(${detail})` : ""}`);
      failedCount++;
    }
  }

  // TEST 1: Unauthenticated access to /api/admin/stats
  console.log("--- TEST 1: Unauthenticated Admin Stats Gate ---");
  const res1 = await fetch(`${BASE_URL}/api/admin/stats`);
  assert(
    res1.status === 401 || res1.status === 403,
    "GET /api/admin/stats as unauthenticated user is rejected with 401/403",
    `Status: ${res1.status}`,
  );

  // TEST 2: Unauthenticated access to /api/admin/users
  console.log("\n--- TEST 2: Unauthenticated User Directory Gate ---");
  const res2 = await fetch(`${BASE_URL}/api/admin/users`);
  assert(
    res2.status === 401 || res2.status === 403,
    "GET /api/admin/users as unauthenticated user is rejected with 401/403",
    `Status: ${res2.status}`,
  );

  // TEST 3: Login as Student
  console.log("\n--- TEST 3: Student Login & RBAC Check ---");
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "alex.dev@gnue.edu", password: "Password123!" }),
  });
  assert(
    studentLoginRes.status === 200,
    "Student login succeeds",
    `Status: ${studentLoginRes.status}`,
  );
  const cookieHeader = studentLoginRes.headers.get("set-cookie") || "";

  // TEST 4: Student session attempts /api/admin/stats
  console.log("\n--- TEST 4: Student Session Access to Admin Stats ---");
  const res4 = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: cookieHeader },
  });
  assert(
    res4.status === 403,
    "GET /api/admin/stats with Student session returns 403 Forbidden",
    `Status: ${res4.status}`,
  );

  // TEST 5: Student session attempts /api/admin/users
  console.log("\n--- TEST 5: Student Session Access to User Directory ---");
  const res5 = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: cookieHeader },
  });
  assert(
    res5.status === 403,
    "GET /api/admin/users with Student session returns 403 Forbidden",
    `Status: ${res5.status}`,
  );

  // TEST 6: Super Admin Login
  console.log("\n--- TEST 6: Super Admin Login & RBAC Check ---");
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is required for RBAC tests.");
    process.exit(1);
  }

  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  assert(
    adminLoginRes.status === 200,
    "Super Admin login succeeds",
    `Status: ${adminLoginRes.status}`,
  );
  const adminCookie = adminLoginRes.headers.get("set-cookie") || "";
  const adminLoginData = await adminLoginRes.json();
  assert(
    adminLoginData.user?.role === "super_admin",
    "Authenticated user role is super_admin",
    `Role: ${adminLoginData.user?.role}`,
  );

  // TEST 7: Super Admin accesses /api/admin/stats
  console.log("\n--- TEST 7: Super Admin Access to Admin Stats ---");
  const res7 = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: adminCookie },
  });
  assert(
    res7.status === 200,
    "GET /api/admin/stats as Super Admin returns 200 OK",
    `Status: ${res7.status}`,
  );
  const statsData = await res7.json();
  assert(
    typeof statsData.totalUsers === "number",
    "Stats payload contains totalUsers metric",
    `Total Users: ${statsData.totalUsers}`,
  );

  // TEST 8: Super Admin accesses /api/admin/users
  console.log("\n--- TEST 8: Super Admin Access to User Directory ---");
  const res8 = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: adminCookie },
  });
  assert(
    res8.status === 200,
    "GET /api/admin/users as Super Admin returns 200 OK",
    `Status: ${res8.status}`,
  );
  const usersData = await res8.json();
  assert(
    Array.isArray(usersData.users) && usersData.users.length > 0,
    "User directory returned users list",
    `User count: ${usersData.users?.length}`,
  );

  // TEST 9: Super Admin role promotion/demotion endpoint
  console.log("\n--- TEST 9: Super Admin Role Update Endpoint ---");
  const res9 = await fetch(`${BASE_URL}/api/admin/update-role`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ targetEmail: "alex.dev@gnue.edu", newRole: "moderator" }),
  });
  assert(
    res9.status === 200,
    "POST /api/admin/update-role as Super Admin returns 200 OK",
    `Status: ${res9.status}`,
  );

  console.log("\n====================================================");
  console.log(`  SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("====================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runRbacTests().catch((err) => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
