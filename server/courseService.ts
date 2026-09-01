import { prisma, connectPrisma } from './prisma';

export class CourseService {
  static async getAllCourses(filter: {
    departmentId?: string;
    level?: string;
    semester?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    await connectPrisma();
    const where: any = { archivedAt: null };
    if (filter.departmentId && filter.departmentId !== 'all') {
      where.departmentId = filter.departmentId;
    }
    if (filter.level && filter.level !== 'all') {
      where.level = filter.level;
    }
    if (filter.semester && filter.semester !== 'all') {
      where.semester = filter.semester;
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { instructor: { contains: q, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 30));
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.course.count({ where }),
    ]);

    return {
      courses: courses.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        credits: c.credits,
        category: c.category,
        universityId: c.universityId,
        facultyId: c.facultyId,
        departmentId: c.departmentId,
        levelId: c.levelId,
        semesterId: c.semesterId,
        instructorId: c.instructorId,
        instructor: c.instructor,
        instructorEmail: c.instructorEmail,
        level: c.level,
        semester: c.semester,
        syllabus: c.syllabus,
        scheduleDayTime: c.scheduleDayTime,
        location: c.location,
        prerequisites: c.prerequisites,
        gradingScheme: c.gradingScheme,
        bannerImage: c.bannerImage,
        archivedAt: c.archivedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getCourseById(id: string) {
    await connectPrisma();
    const course = await prisma.course.findFirst({ where: { id, archivedAt: null } });
    if (!course) return null;
    return {
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description,
      credits: course.credits,
      category: course.category,
      universityId: course.universityId,
      facultyId: course.facultyId,
      departmentId: course.departmentId,
      levelId: course.levelId,
      semesterId: course.semesterId,
      instructorId: course.instructorId,
      instructor: course.instructor,
      instructorEmail: course.instructorEmail,
      level: course.level,
      semester: course.semester,
      syllabus: course.syllabus,
      scheduleDayTime: course.scheduleDayTime,
      location: course.location,
      prerequisites: course.prerequisites,
      gradingScheme: course.gradingScheme,
      bannerImage: course.bannerImage,
      archivedAt: course.archivedAt,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  static async createCourse(data: any) {
    await connectPrisma();
    const course = await prisma.course.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        credits: data.credits ?? 3,
        category: data.category || 'CORE',
        universityId: data.universityId || 'uni-gnue-01',
        facultyId: data.facultyId || 'fac-eng-01',
        departmentId: data.departmentId,
        levelId: data.levelId || 'lvl-y1',
        semesterId: data.semesterId || 'sem-fall-2026',
        instructorId: data.instructorId,
        instructor: data.instructor,
        instructorEmail: data.instructorEmail,
        level: data.level,
        semester: data.semester,
        syllabus: data.syllabus || [],
        scheduleDayTime: data.scheduleDayTime,
        location: data.location,
        prerequisites: data.prerequisites || [],
        gradingScheme: data.gradingScheme || [],
        bannerImage: data.bannerImage,
      },
    });
    return course;
  }

  static async updateCourse(id: string, data: any) {
    await connectPrisma();
    const updateData: any = {};
    const allowed = [
      'code', 'title', 'description', 'credits', 'category',
      'departmentId', 'levelId', 'semesterId', 'instructorId',
      'instructor', 'instructorEmail', 'level', 'semester',
      'syllabus', 'scheduleDayTime', 'location', 'prerequisites',
      'gradingScheme', 'bannerImage'
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }
    const course = await prisma.course.update({ where: { id }, data: updateData });
    return course;
  }

  static async deleteCourse(id: string) {
    await connectPrisma();
    await prisma.course.update({ where: { id }, data: { archivedAt: new Date() } });
    return true;
  }
}
