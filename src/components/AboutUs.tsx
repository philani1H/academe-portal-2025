import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// No hardcoded fallback
const defaultTeamMembers: TeamMember[] = []
const defaultAboutUsContent: AboutUsContent = { id: '', goal: '', mission: '', rolesResponsibilities: {}, isActive: true }

export default function AboutUs() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(defaultTeamMembers);
  const [aboutUsContent, setAboutUsContent] = useState<AboutUsContent>(defaultAboutUsContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutUsData();
  }, []);

  const fetchAboutUsData = async () => {
    try {
      // Fetch team members
      const teamResponse = await fetch('/api/admin/content/team-members');
      if (!teamResponse.ok) throw new Error('Failed to load team members')
      const teamData = await teamResponse.json();
      setTeamMembers(teamData);

      // Fetch about us content
      const aboutResponse = await fetch('/api/admin/content/about-us');
      if (!aboutResponse.ok) throw new Error('Failed to load about us')
      const aboutData = await aboutResponse.json();
      setAboutUsContent(aboutData);
    } catch (error) {
      console.error('Error fetching about us data:', error);
      setTeamMembers(defaultTeamMembers)
      setAboutUsContent(defaultAboutUsContent)
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="bg-blue-900 text-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Leadership Team</h2>

        {/* Goal and Mission Section */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-semibold mb-4">Our Goal</h3>
          <p className="text-lg text-gray-300">
            {aboutUsContent.goal}
          </p>
        </div>
        <div className="text-center mb-12">
          <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
          <p className="text-lg text-gray-300">
            {aboutUsContent.mission}
          </p>
        </div>

        {/* Leadership Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {teamMembers.map((member, index) => (
            <Card key={index} className="bg-gray-50 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-48 h-48 rounded-full mx-auto mb-4 object-cover"
                />
                <CardTitle className="text-xl font-semibold text-blue-900 text-center">
                  {member.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-blue-900 font-medium text-center mb-2">{member.role}</p>
                <p className="text-gray-600 text-center">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Appendix Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Roles, Responsibilities, and Duties</h3>
          <p className="text-lg text-gray-300">
          This Appendix forms part of the agreement entered into on 3rd January 2025 by Excellence Akademie and the parties outlined below. All parties agree to fulfill their roles and responsibilities as outlined in this document.
          </p>

          <div className="mt-8 text-left text-gray-300">
            <h4 className="text-xl font-semibold">1. Chief Executive Officer (CEO)</h4>
            <ul className="list-disc pl-5">
              <li>Set the vision and strategic goals of the company.</li>
              <li>Develop and implement long-term business strategies.</li>
              <li>Make key decisions regarding operations, finances, and growth opportunities.</li>
              <li>Represent the company in public forums, including media, stakeholder meetings, and industry events.</li>
            </ul>
            <h4 className="text-xl font-semibold mt-4">2. Chief Administrative Officer (CAO)</h4>
            <ul className="list-disc pl-5">
              <li>Oversee human resources, financial management, facilities management, and compliance operations.</li>
              <li>Manage day-to-day administrative tasks to ensure operational efficiency.</li>
              <li>Establish and implement policies to maintain organizational compliance and governance.</li>
            </ul>
            <h4 className="text-xl font-semibold mt-4">3. Chief Technology Officer (CTO)</h4>
            <ul className="list-disc pl-5">
              <li>Develop and oversee the organization’s technology strategy and solutions.</li>
              <li>Manage and maintain the company’s technology infrastructure.</li>
              <li>Ensure technology initiatives align with the company’s business goals.</li>
              <li>Stay informed of emerging technologies and integrate them when appropriate.</li>
            </ul>
            <h4 className="text-xl font-semibold mt-4">4. Shareholder</h4>
            <ul className="list-disc pl-5">
              <li>Hold a portion of the company’s shares, entitling them to dividends and a claim on profits.</li>
              <li>Exercise voting rights to influence key company decisions.</li>
              <li>Maintain the ability to transfer or sell their shares under the conditions set by the company.</li>
            </ul>
            <h4 className="text-xl font-semibold mt-4">5. Non-Executive Director (NED)</h4>
            <ul className="list-disc pl-5">
              <li>Offer independent expertise and advice to the board.</li>
              <li>Assist in driving the company’s success by providing oversight on key strategic decisions.</li>
              <li>Ensure the company adheres to best practices and governance principles.</li>
            </ul>
            <h4 className="text-xl font-semibold mt-4">6. Employee</h4>
            <ul className="list-disc pl-5">
              <li>Perform assigned tasks and duties as per their employment agreement.</li>
              <li>Abide by company policies and procedures.</li>
              <li>Report to their designated supervisor or manager.</li>
            </ul>
            <h4 className="text-xl font-semibold mt-4">7. Head of Discipline</h4>
            <ul className="list-disc pl-5">
              <li>Ensure disciplinary procedures and policies are consistently applied.</li>
              <li>Oversee employee behavior and performance in alignment with company standards.</li>
              <li>Provide guidance and corrective actions when necessary.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
