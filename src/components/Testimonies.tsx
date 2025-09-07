const testimonies = [
  
    {
      name: "Sarah Johnson",
      role: "Student",
      subjects: ["Business", "Maths", "Accounting"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "Excellence Academia 25 has transformed my learning experience. The tutors are exceptional!",
    },
    {
      name: "Michael Chen",
      role: "Parent",
      subjects: ["Maths", "Science"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "I've seen a significant improvement in my child's grades since enrolling in Excellence Academia 25.",
    },
    {
      name: "Emily Rodriguez",
      role: "Tutor",
      subjects: ["English", "History"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "Being a tutor at Excellence Academia 25 has been incredibly rewarding. The platform is top-notch!",
    },
    {
      name: "John Doe",
      role: "Student",
      subjects: ["Physics", "Maths"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The personalized support I received at Excellence Academia 25 was amazing!",
    },
    {
      name: "Aisha Khan",
      role: "Parent",
      subjects: ["Chemistry", "Biology"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "My daughter loves learning here and is excelling like never before.",
    },
    {
      name: "Raj Patel",
      role: "Tutor",
      subjects: ["Economics", "Business Studies"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "Teaching at Excellence Academia 25 has allowed me to connect with bright students worldwide.",
    },
    {
      name: "Lucy Adams",
      role: "Student",
      subjects: ["Art", "History"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The interactive classes make learning so much fun and engaging!",
    },
    {
      name: "Carlos Rivera",
      role: "Parent",
      subjects: ["English", "Maths"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The flexible schedule has made a world of difference for our family.",
    },
    {
      name: "Nina Kim",
      role: "Tutor",
      subjects: ["Maths", "Physics"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "This platform allows tutors to bring out the best in their students.",
    },
    {
      name: "Oscar Wright",
      role: "Student",
      subjects: ["Geography", "History"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "Thanks to Excellence Academia 25, I feel more confident in my studies.",
    },
    {
      name: "Sophia Lopez",
      role: "Parent",
      subjects: ["Science", "English"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The tutors here have inspired my child to love learning again!",
    },
    {
      name: "Ethan Brooks",
      role: "Tutor",
      subjects: ["Computer Science", "Maths"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The technology and resources provided are exceptional for online teaching.",
    },
    {
      name: "Olivia Green",
      role: "Student",
      subjects: ["Biology", "Chemistry"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "I’ve improved my grades and gained confidence thanks to this platform!",
    },
    {
      name: "Amir Ahmed",
      role: "Parent",
      subjects: ["Accounting", "Economics"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The structured programs have worked wonders for my son’s progress.",
    },
    {
      name: "Liam Taylor",
      role: "Tutor",
      subjects: ["History", "Political Science"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The platform’s design makes it easy to manage and inspire students.",
    },
    {
      name: "Grace Hall",
      role: "Student",
      subjects: ["English", "Art"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "Learning feels so exciting and creative here. Highly recommend!",
    },
    {
      name: "Benjamin White",
      role: "Parent",
      subjects: ["Science", "Maths"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The tutors have provided invaluable support for my daughter’s studies.",
    },
    {
      name: "Hannah Evans",
      role: "Tutor",
      subjects: ["Maths", "Statistics"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "Excellence Academia 25 is a hub for passionate educators.",
    },
    {
      name: "Ryan Walker",
      role: "Student",
      subjects: ["Physics", "Chemistry"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "The detailed explanations helped me ace my exams!",
    },
    {
      name: "Ella Brown",
      role: "Parent",
      subjects: ["English", "Biology"],
      image: "https://i.imgur.com/mrQ0rDu.png",
      content: "Seeing my child succeed has been the most rewarding experience!",
    },
  ];
  
  export default function Testimonies() {
    return (
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What People Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonies.map((testimony, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <img
                    src={testimony.image}
                    alt={`${testimony.name}'s Avatar`}
                    className="rounded-full mr-4"
                    width={50}
                    height={50}
                  />
                  <div>
                    <h3 className="font-semibold">{testimony.name}</h3>
                    <p className="text-gray-600">{testimony.role}</p>
                    <div className="text-sm text-gray-500">
                      <span className="font-semibold">Subjects: </span>
                      {testimony.subjects.join(", ")}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{testimony.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  