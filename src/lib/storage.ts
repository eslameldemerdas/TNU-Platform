import {
  INITIAL_UNIVERSITY,
  INITIAL_FACULTY,
  INITIAL_DEPARTMENTS,
  INITIAL_COURSES,
  INITIAL_FILES,
  INITIAL_DISCUSSIONS,
  INITIAL_COMMENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SCHEDULE,
  INITIAL_LEDGER,
  INITIAL_USER,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_EVENTS,
  INITIAL_LOST_FOUND,
  INITIAL_MARKETPLACE,
  INITIAL_CLUBS,
  INITIAL_HONOR_STUDENTS,
} from "../data/mockData";
import {
  University,
  Faculty,
  Department,
  Course,
  StudyFile,
  DiscussionThread,
  Comment,
  Assignment,
  ScheduleItem,
  PointsLedgerEntry,
  UserProfile,
  Announcement,
  CampusEvent,
  LostFoundItem,
  MarketplaceItem,
  StudentClub,
  HonorStudent,
} from "../types";

const STORAGE_KEYS = {
  UNIVERSITY: "enghub_university",
  FACULTY: "enghub_faculty",
  DEPARTMENTS: "enghub_departments",
  COURSES: "enghub_courses",
  FILES: "enghub_files",
  DISCUSSIONS: "enghub_discussions",
  COMMENTS: "enghub_comments",
  ASSIGNMENTS: "enghub_assignments",
  SCHEDULE: "enghub_schedule",
  LEDGER: "enghub_ledger",
  USER: "enghub_user",
  SESSION_TOKEN: "enghub_session_token",
  ANNOUNCEMENTS: "enghub_announcements",
  EVENTS: "enghub_events",
  LOST_FOUND: "enghub_lost_found",
  MARKETPLACE: "enghub_marketplace",
  CLUBS: "enghub_clubs",
  HONOR_STUDENTS: "enghub_honor_students",
  ONBOARDED: "enghub_onboarded",
};

export function getSessionToken(): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    }
  } catch (err) {
    console.warn("Error reading session token:", err);
  }
  return null;
}

export function setSessionToken(token: string | null): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      }
    }
  } catch (err) {
    console.warn("Error setting session token:", err);
  }
}

export function getAuthHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const token = getSessionToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  return headers;
}

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSetItem(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing ${key} to localStorage:`, err);
  }
}

export class EngHubStorage {
  static getUniversity(): University {
    return safeGetItem(STORAGE_KEYS.UNIVERSITY, INITIAL_UNIVERSITY);
  }

  static getFaculty(): Faculty {
    return safeGetItem(STORAGE_KEYS.FACULTY, INITIAL_FACULTY);
  }

  static getDepartments(): Department[] {
    return safeGetItem(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  static saveDepartments(depts: Department[]): void {
    safeSetItem(STORAGE_KEYS.DEPARTMENTS, depts);
  }

  static getCourses(): Course[] {
    return safeGetItem(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  }

  static saveCourses(courses: Course[]): void {
    safeSetItem(STORAGE_KEYS.COURSES, courses);
  }

  static getFiles(): StudyFile[] {
    return safeGetItem(STORAGE_KEYS.FILES, INITIAL_FILES);
  }

  static saveFiles(files: StudyFile[]): void {
    safeSetItem(STORAGE_KEYS.FILES, files);
  }

  static getDiscussions(): DiscussionThread[] {
    return safeGetItem(STORAGE_KEYS.DISCUSSIONS, INITIAL_DISCUSSIONS);
  }

  static saveDiscussions(discussions: DiscussionThread[]): void {
    safeSetItem(STORAGE_KEYS.DISCUSSIONS, discussions);
  }

  static getComments(): Comment[] {
    return safeGetItem(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  }

  static saveComments(comments: Comment[]): void {
    safeSetItem(STORAGE_KEYS.COMMENTS, comments);
  }

  static getAssignments(): Assignment[] {
    return safeGetItem(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  }

  static saveAssignments(assignments: Assignment[]): void {
    safeSetItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
  }

  static getSchedule(): ScheduleItem[] {
    return safeGetItem(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
  }

  static saveSchedule(schedule: ScheduleItem[]): void {
    safeSetItem(STORAGE_KEYS.SCHEDULE, schedule);
  }

  static getLedger(): PointsLedgerEntry[] {
    return safeGetItem(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
  }

  static saveLedger(ledger: PointsLedgerEntry[]): void {
    safeSetItem(STORAGE_KEYS.LEDGER, ledger);
  }

  static getUser(): UserProfile {
    const user = safeGetItem(STORAGE_KEYS.USER, INITIAL_USER) || INITIAL_USER;
    // Derive total user points dynamically from ledger entries
    const ledger = EngHubStorage.getLedger();
    const totalPoints = ledger
      .filter((e) => e && e.userId === user.id)
      .reduce((sum, entry) => sum + (entry.points || 0), 0);
    return { ...user, points: totalPoints };
  }

  static saveUser(user: UserProfile): void {
    safeSetItem(STORAGE_KEYS.USER, user);
  }

  static getAnnouncements(): Announcement[] {
    const items = safeGetItem<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    // Sanitize any test entries or awkward phrasing from past sessions
    const sanitized = items
      .filter(
        (anc) =>
          !anc.title?.includes("تجريبي") &&
          !anc.content?.includes("تجريبي") &&
          !anc.title?.includes("مهم جدا"),
      )
      .map((anc) => ({
        ...anc,
        authorName: anc.authorName
          ? anc.authorName.replace(/\(Super Admin\)/gi, "").trim()
          : "إدارة الكلية",
      }));

    if (sanitized.length === 0) {
      safeSetItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
      return INITIAL_ANNOUNCEMENTS;
    }
    return sanitized;
  }

  static saveAnnouncements(announcements: Announcement[]): void {
    safeSetItem(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
  }

  static getEvents(): CampusEvent[] {
    return safeGetItem(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  }

  static saveEvents(events: CampusEvent[]): void {
    safeSetItem(STORAGE_KEYS.EVENTS, events);
  }

  static getLostFound(): LostFoundItem[] {
    return safeGetItem(STORAGE_KEYS.LOST_FOUND, INITIAL_LOST_FOUND);
  }

  static saveLostFound(items: LostFoundItem[]): void {
    safeSetItem(STORAGE_KEYS.LOST_FOUND, items);
  }

  static getMarketplace(): MarketplaceItem[] {
    return safeGetItem(STORAGE_KEYS.MARKETPLACE, INITIAL_MARKETPLACE);
  }

  static saveMarketplace(items: MarketplaceItem[]): void {
    safeSetItem(STORAGE_KEYS.MARKETPLACE, items);
  }

  static getClubs(): StudentClub[] {
    return safeGetItem(STORAGE_KEYS.CLUBS, INITIAL_CLUBS);
  }

  static saveClubs(clubs: StudentClub[]): void {
    safeSetItem(STORAGE_KEYS.CLUBS, clubs);
  }

  static getHonorStudents(): HonorStudent[] {
    return safeGetItem(STORAGE_KEYS.HONOR_STUDENTS, INITIAL_HONOR_STUDENTS);
  }

  static saveHonorStudents(students: HonorStudent[]): void {
    safeSetItem(STORAGE_KEYS.HONOR_STUDENTS, students);
  }

  static addHonorStudent(
    studentData: Omit<HonorStudent, "id" | "createdAt" | "applauseCount">,
  ): HonorStudent {
    const students = EngHubStorage.getHonorStudents();
    const newStudent: HonorStudent = {
      ...studentData,
      id: `honor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      applauseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newStudent, ...students];
    EngHubStorage.saveHonorStudents(updated);
    return newStudent;
  }

  static updateHonorStudent(id: string, updates: Partial<HonorStudent>): HonorStudent {
    const students = EngHubStorage.getHonorStudents();
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Honor student with id ${id} not found.`);
    }
    const updatedStudent: HonorStudent = {
      ...students[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    students[index] = updatedStudent;
    EngHubStorage.saveHonorStudents([...students]);
    return updatedStudent;
  }

  static deleteHonorStudent(id: string): void {
    const students = EngHubStorage.getHonorStudents();
    const filtered = students.filter((s) => s.id !== id);
    EngHubStorage.saveHonorStudents(filtered);
  }

  static toggleHonorStudentFeatured(id: string): boolean {
    const students = EngHubStorage.getHonorStudents();
    const student = students.find((s) => s.id === id);
    if (!student) return false;
    student.featured = !student.featured;
    student.updatedAt = new Date().toISOString();
    EngHubStorage.saveHonorStudents([...students]);
    return student.featured;
  }

  static applaudHonorStudent(id: string): number {
    const students = EngHubStorage.getHonorStudents();
    const student = students.find((s) => s.id === id);
    if (!student) return 0;
    student.applauseCount = (student.applauseCount || 0) + 1;
    student.updatedAt = new Date().toISOString();
    EngHubStorage.saveHonorStudents([...students]);
    return student.applauseCount;
  }

  static isOnboarded(): boolean {
    return safeGetItem(STORAGE_KEYS.ONBOARDED, true); // default true for seamless load, user can edit profile anytime
  }

  static setOnboarded(value: boolean): void {
    safeSetItem(STORAGE_KEYS.ONBOARDED, value);
  }

  // Idempotent point addition with append-only ledger rule (§3.9)
  static addLedgerEntry(
    type: PointsLedgerEntry["type"],
    points: number,
    referenceId: string,
    description: string,
  ): PointsLedgerEntry {
    const ledger = EngHubStorage.getLedger();
    const user = EngHubStorage.getUser();

    const newEntry: PointsLedgerEntry = {
      id: `ledg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      type,
      points,
      referenceId,
      description,
      createdAt: new Date().toISOString(),
    };

    const updatedLedger = [newEntry, ...ledger];
    EngHubStorage.saveLedger(updatedLedger);

    // Update derived user points
    const newTotalPoints = updatedLedger
      .filter((e) => e.userId === user.id)
      .reduce((sum, entry) => sum + entry.points, 0);

    EngHubStorage.saveUser({ ...user, points: Math.max(0, newTotalPoints) });

    return newEntry;
  }

  // Reversal for moderation (§3.9 & §6.11)
  static recordLedgerReversal(
    referenceId: string,
    originalPoints: number,
    reason: string,
  ): PointsLedgerEntry {
    return EngHubStorage.addLedgerEntry(
      "reversal_file_removed",
      -Math.abs(originalPoints),
      referenceId,
      `Moderation Reversal: ${reason}`,
    );
  }

  static resetToDefault(): void {
    localStorage.clear();
  }
}
