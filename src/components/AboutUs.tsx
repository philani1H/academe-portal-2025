import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api"
interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  isActive: boolean;
  order: number;
}

interface AboutUsContent {
  id: string;
  goal: string;
  mission: string;
  rolesResponsibilities: any;
  isActive: boolean;
}

const defaultTeamMembers: TeamMember[] = [];
const defaultAboutUsContent: AboutUsContent = { 
  id: '', 
  goal: 'To empower individuals and organizations through excellence in education and professional development.', 
  mission: 'We strive to deliver innovative learning solutions that transform lives and drive success in an ever-evolving world.', 
  rolesResponsibilities: {}, 
  isActive: true 
};

export default function AboutUs() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(defaultTeamMembers);
  const [aboutUsContent, setAboutUsContent] = useState<AboutUsContent>(defaultAboutUsContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutUsData();
  }, []);

  const fetchAboutUsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch team members
      try {
        const teamData = await apiFetch<any[]>('/api/admin/content/team-members');
        // Ensure teamData is an array
        if (Array.isArray(teamData)) {
          setTeamMembers(teamData.filter(member => member.isActive).sort((a, b) => a.order - b.order));
        } else {
          console.warn('Team data is not an array:', teamData);
          setTeamMembers(defaultTeamMembers);
        }
      } catch (teamError) {
        console.error('Error fetching team members:', teamError);
        setTeamMembers(defaultTeamMembers);
      }

      // Fetch about us content
      try {
        const aboutData = await apiFetch<AboutUsContent>('/api/admin/content/about-us');
        if (aboutData && typeof aboutData === 'object') {
          setAboutUsContent({ ...defaultAboutUsContent, ...aboutData });
        } else {
          setAboutUsContent(defaultAboutUsContent);
        }
      } catch (aboutError) {
        console.error('Error fetching about us content:', aboutError);
        setAboutUsContent(defaultAboutUsContent);
      }

    } catch (error) {
      console.error('Error fetching about us data:', error);
      setError('Failed to load content. Please try again later.');
      setTeamMembers(defaultTeamMembers);
      setAboutUsContent(defaultAboutUsContent);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face';
  };

  if (loading) {
    return (
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8">
            <p className="text-center">{error}</p>
          </div>
        )}

        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            About Excellence Akademie
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto rounded-full"></div>
        </div>

        {/* Goal and Mission Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold">Our Goal</h3>
            </div>
            <p className="text-gray-200 text-lg leading-relaxed">
              {aboutUsContent.goal || 'To empower individuals and organizations through excellence in education and professional development.'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold">Our Mission</h3>
            </div>
            <p className="text-gray-200 text-lg leading-relaxed">
              {aboutUsContent.mission || 'We strive to deliver innovative learning solutions that transform lives and drive success in an ever-evolving world.'}
            </p>
          </div>
        </div>

        {/* Leadership Team Cards */}
        {Array.isArray(teamMembers) && teamMembers.length > 0 && (
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <Card 
                  key={member.id || member.name} 
                  className="bg-white/95 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-2xl hover:scale-105 border-0 overflow-hidden"
                >
                  <CardHeader className="border-b border-gray-100 pb-6">
                    <div className="relative">
                      <img
                        src={member.image || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face`}
                        alt={member.name}
                        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-gradient-to-r from-blue-400 to-indigo-400 shadow-lg"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 w-32 h-32 mx-auto"></div>
                    </div>
                    <CardTitle className="text-xl font-bold text-blue-900 text-center">
                      {member.name}
                    </CardTitle>
                    <p className="text-blue-700 font-semibold text-center text-sm uppercase tracking-wide">
                      {member.role}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-600 text-center text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Roles and Responsibilities Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-4">Roles, Responsibilities, and Duties</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-200 text-lg max-w-4xl mx-auto leading-relaxed">
              This Appendix forms part of the agreement entered into on 3rd January 2025 by Excellence Akademie and the parties outlined below. All parties agree to fulfill their roles and responsibilities as outlined in this document.
            </p>
          </div>

          <div className="grid gap-8">
            {[
              {
                title: "Chief Executive Officer (CEO)",
                icon: "👔",
                responsibilities: [
                  "Set the vision and strategic goals of the company.",
                  "Develop and implement long-term business strategies.",
                  "Make key decisions regarding operations, finances, and growth opportunities.",
                  "Represent the company in public forums, including media, stakeholder meetings, and industry events."
                ]
              },
              {
                title: "Chief Administrative Officer (CAO)",
                icon: "📋",
                responsibilities: [
                  "Oversee human resources, financial management, facilities management, and compliance operations.",
                  "Manage day-to-day administrative tasks to ensure operational efficiency.",
                  "Establish and implement policies to maintain organizational compliance and governance."
                ]
              },
              {
                title: "Chief Technology Officer (CTO)",
                icon: "💻",
                responsibilities: [
                  "Develop and oversee the organization's technology strategy and solutions.",
                  "Manage and maintain the company's technology infrastructure.",
                  "Ensure technology initiatives align with the company's business goals.",
                  "Stay informed of emerging technologies and integrate them when appropriate."
                ]
              },
              {
                title: "Shareholder",
                icon: "📈",
                responsibilities: [
                  "Hold a portion of the company's shares, entitling them to dividends and a claim on profits.",
                  "Exercise voting rights to influence key company decisions.",
                  "Maintain the ability to transfer or sell their shares under the conditions set by the company."
                ]
              },
              {
                title: "Non-Executive Director (NED)",
                icon: "🎯",
                responsibilities: [
                  "Offer independent expertise and advice to the board.",
                  "Assist in driving the company's success by providing oversight on key strategic decisions.",
                  "Ensure the company adheres to best practices and governance principles."
                ]
              },
              {
                title: "Employee",
                icon: "👥",
                responsibilities: [
                  "Perform assigned tasks and duties as per their employment agreement.",
                  "Abide by company policies and procedures.",
                  "Report to their designated supervisor or manager."
                ]
              },
              {
                title: "Head of Discipline",
                icon: "⚖️",
                responsibilities: [
                  "Ensure disciplinary procedures and policies are consistently applied.",
                  "Oversee employee behavior and performance in alignment with company standards.",
                  "Provide guidance and corrective actions when necessary."
                ]
              }
            ].map((role, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">{role.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white">{index + 1}. {role.title}</h4>
                </div>
                <ul className="space-y-2 ml-16">
                  {role.responsibilities.map((responsibility, idx) => (
                    <li key={idx} className="flex items-start text-gray-200">
                      <span className="text-blue-400 mr-2 mt-1">•</span>
                      <span className="leading-relaxed">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}