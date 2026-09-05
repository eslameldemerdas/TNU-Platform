import 'dotenv/config';

async function main() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'eldmrdasheslam1@gmail.com', password: 'UgF0YVaMhQKRpiBID36EnmST' }),
  });
  const loginText = await loginRes.text();
  console.log('Login status:', loginRes.status);
  
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  console.log('Cookie:', cookie);
  
  if (!cookie) {
    console.log('No cookie obtained');
    return;
  }

  const examRes = await fetch('http://localhost:3000/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      courseId: 'course-eng011',
      courseCode: 'TEST',
      title: 'Test Exam',
      topic: 'Test',
      durationMinutes: 60,
      totalMarks: 100,
      difficulty: 'Medium',
      term: 'Quiz',
      departmentId: 'dept-cmp',
      questions: [{ id: 'q1', question: 'Q?', options: ['A', 'B'], correctIndex: 0 }]
    }),
  });
  const examText = await examRes.text();
  console.log('Exam create status:', examRes.status);
  console.log('Exam create response:', examText.slice(0, 500));
}

main().catch(console.error);
