
async function main() {
  try {
    const response = await fetch('http://localhost:3000/api/student/dashboard?studentId=4');
    const data = await response.json();
    
    console.log('--- DASHBOARD DATA ---');
    console.log('Student:', data.student);
    console.log('Courses:', data.courses?.map((c: any) => ({
        name: c.name,
        nextSession: c.nextSession,
        nextSessionDate: c.nextSessionDate
    })));
    console.log('----------------------');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
