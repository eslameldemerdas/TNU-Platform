import "dotenv/config";
import { prisma } from "../server/prisma.ts";

const BASE = "http://localhost:3000";
const RUN = Date.now();
const emailA = `campus.a.${RUN}@test.edu`;
const emailB = `campus.b.${RUN}@test.edu`;
const password = "Password123!";

function log(name: string, pass: boolean, detail: string) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) process.exitCode = 1;
}

async function request(method: string, path: string, body?: unknown, cookie?: string) {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

function cookieOf(response: Response) {
  return response.headers.get("set-cookie")?.split(";")[0] || "";
}

async function main() {
  const surviveRestart = process.argv.includes("--survive-restart");
  for (const [name, email] of [["A", emailA], ["B", emailB]]) {
    const signup = await request("POST", "/api/auth/signup", {
      fullName: `Campus User ${name}`,
      email,
      phoneNumber: "+201001234567",
      password,
      passwordConfirm: password,
      departmentId: "dept-cmp",
      level: "Year 1 (Freshman)",
    });
    log(`user ${name}: signup`, signup.response.status === 201, `status=${signup.response.status}`);
  }

  const loginA = await request("POST", "/api/auth/login", { email: emailA, password });
  const loginB = await request("POST", "/api/auth/login", { email: emailB, password });
  const cookieA = cookieOf(loginA.response);
  const cookieB = cookieOf(loginB.response);
  log("user A: login", loginA.response.status === 200, `status=${loginA.response.status}`);
  log("user B: login", loginB.response.status === 200, `status=${loginB.response.status}`);

  const marketplaceCreate = await request(
    "POST",
    "/api/marketplace",
    {
      title: `Persistent Marketplace ${RUN}`,
      description: "Database persistence verification listing",
      price: 42,
      category: "textbook",
      condition: "good",
      contactInfo: "WhatsApp: +201001234567",
      whatsappNumber: "+201001234567",
      images: [],
    },
    cookieA,
  );
  const marketplaceId = marketplaceCreate.body?.listing?.id;
  log("marketplace: create via API", marketplaceCreate.response.status === 201 && !!marketplaceId, `id=${marketplaceId}`);
  const marketplaceRow = marketplaceId
    ? await prisma.marketplaceListing.findUnique({ where: { id: marketplaceId } })
    : null;
  log("marketplace: direct DB row exists", !!marketplaceRow, `title=${marketplaceRow?.title}`);

  const lostCreate = await request(
    "POST",
    "/api/lost-found",
    {
      type: "lost",
      title: `Persistent Lost Found ${RUN}`,
      description: "Database persistence verification report",
      location: "Engineering Lab",
      contactInfo: "Reporter contact",
    },
    cookieA,
  );
  const lostId = lostCreate.body?.post?.id;
  log("lost-found: create via API", lostCreate.response.status === 201 && !!lostId, `id=${lostId}`);
  const lostRow = lostId ? await prisma.lostFoundPost.findUnique({ where: { id: lostId } }) : null;
  log("lost-found: direct DB row exists", !!lostRow, `title=${lostRow?.title}`);

  const marketplaceList = await request("GET", "/api/marketplace", undefined, cookieB);
  const lostList = await request("GET", "/api/lost-found", undefined, cookieB);
  log("marketplace: different user can see listing", marketplaceList.body?.listings?.some((item: any) => item.id === marketplaceId), `status=${marketplaceList.response.status}`);
  log("lost-found: different user can see post", lostList.body?.posts?.some((item: any) => item.id === lostId), `status=${lostList.response.status}`);

  const marketplaceUpdate = await request("PATCH", `/api/marketplace/${marketplaceId}`, { status: "sold" }, cookieA);
  const marketplaceUpdatedRow = await prisma.marketplaceListing.findUnique({ where: { id: marketplaceId } });
  log("marketplace: update", marketplaceUpdate.response.status === 200, `status=${marketplaceUpdate.response.status}`);
  log("marketplace: DB reflects sold", marketplaceUpdatedRow?.status === "sold", `status=${marketplaceUpdatedRow?.status}`);

  const lostUpdate = await request("PATCH", `/api/lost-found/${lostId}`, { status: "resolved" }, cookieA);
  const lostUpdatedRow = await prisma.lostFoundPost.findUnique({ where: { id: lostId } });
  log("lost-found: update", lostUpdate.response.status === 200, `status=${lostUpdate.response.status}`);
  log("lost-found: DB reflects resolved", lostUpdatedRow?.status === "resolved", `status=${lostUpdatedRow?.status}`);

  if (surviveRestart) {
    console.log(`RESTART_IDS marketplace=${marketplaceId} lostFound=${lostId}`);
  } else {
    const marketplaceDelete = await request("DELETE", `/api/marketplace/${marketplaceId}`, undefined, cookieA);
    const lostDelete = await request("DELETE", `/api/lost-found/${lostId}`, undefined, cookieA);
    log("marketplace: delete", marketplaceDelete.response.status === 200, `status=${marketplaceDelete.response.status}`);
    log("lost-found: delete", lostDelete.response.status === 200, `status=${lostDelete.response.status}`);
    log("marketplace: direct DB row deleted", (await prisma.marketplaceListing.findUnique({ where: { id: marketplaceId } })) === null, "row=null");
    log("lost-found: direct DB row deleted", (await prisma.lostFoundPost.findUnique({ where: { id: lostId } })) === null, "row=null");
  }
}

main().finally(() => prisma.$disconnect());
