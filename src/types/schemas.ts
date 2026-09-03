import { z } from "zod";

export const HonorStudentSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  studentId: z.string().max(50).optional(),
  email: z.string().email().optional(),
  avatar: z.string().max(10000000).optional(),
  departmentId: z.string().min(1).max(100),
  departmentName: z.string().max(200).optional(),
  level: z.string().min(1).max(50),
  semester: z.string().max(50).optional(),
  achievementTitle: z.string().min(1).max(300),
  category: z.string().min(1).max(50),
  description: z.string().min(1).max(2000),
  honoredDate: z.string().min(1).max(50),
  academicYear: z.string().min(1).max(20),
  gpaOrMetric: z.string().max(50).optional(),
  badgeLabel: z.string().max(100).optional(),
  certificateUrl: z.string().max(20000000).optional(),
  projectUrl: z.string().max(1000).optional(),
  supervisorName: z.string().max(200).optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export type HonorStudentPayload = z.infer<typeof HonorStudentSchema>;

export const CourseSchema = z.object({
  code: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  creditHours: z.number().int().min(1).max(10).optional(),
  credits: z.number().int().min(1).max(10).optional(),
  category: z.enum(["CORE", "ELECTIVE", "GENERAL"]).optional(),
  departmentId: z.string().min(1).max(100),
  facultyId: z.string().min(1).max(100),
  levelId: z.string().min(1).max(100),
  semesterId: z.string().min(1).max(100),
  instructorId: z.string().uuid().optional(),
  instructor: z.string().max(200).optional(),
  instructorEmail: z.string().email().optional(),
  level: z.string().max(50).optional(),
  semester: z.string().max(50).optional(),
  syllabus: z.array(z.string()).optional(),
  scheduleDayTime: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  prerequisites: z.array(z.string()).optional(),
  gradingScheme: z.array(z.object({ category: z.string(), weight: z.number() })).optional(),
  bannerImage: z.string().max(10000000).optional(),
});

export type CoursePayload = z.infer<typeof CourseSchema>;
