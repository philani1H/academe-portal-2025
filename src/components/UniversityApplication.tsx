import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ...existing code...
const UniversityApplication = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([])
  const [courses, setCourses] = useState<string[]>([])
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await apiFetch<any>('/api/admin/content/university-application')
        const services = Array.isArray(JSON.parse(data.services || '[]')) ? JSON.parse(data.services) : []
        const reqs = Array.isArray(JSON.parse(data.requirements || '[]')) ? JSON.parse(data.requirements) : []
        const coursesList = Array.isArray(JSON.parse(data.process || '[]')) ? JSON.parse(data.process) : []
        setUniversities(services)
        setCourses(coursesList)
      } catch (e) {
        setUniversities([])
        setCourses([])
      }
    }
    fetchContent()
  }, [])
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    email: "",
    phone: "",
    address: "",
    selectedUniversity: "",
    academicLevel: "",
    studentIdDocument: null,
    parentIdDocument: null,
    academicResults: null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleUniversityToggle = (university: string) => {
    if (selectedUniversities.includes(university)) {
      setSelectedUniversities(selectedUniversities.filter(u => u !== university));
    } else if (selectedUniversities.length < 7) {
      setSelectedUniversities([...selectedUniversities, university]);
    } else {
      toast({
        title: "Selection limit reached",
        description: "You can only select up to 7 universities",
        variant: "destructive"
      });
    }
  };

  const handleCourseToggle = (course: string) => {
    if (selectedCourses.includes(course)) {
      setSelectedCourses(selectedCourses.filter(c => c !== course));
    } else if (selectedCourses.length < 7) {
      setSelectedCourses([...selectedCourses, course]);
    } else {
      toast({
        title: "Selection limit reached",
        description: "You can only select up to 7 courses",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedUniversities.length === 0 || selectedCourses.length === 0) {
        toast({
          title: "Incomplete selection",
          description: "Please select at least one university and one course",
          variant: "destructive"
        });
        return;
      }

      // Here you would typically send the data to your backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully"
      });

      // Reset form
      setFormData({
        fullName: "",
        age: "",
        email: "",
        phone: "",
        address: "",
        selectedUniversity: "",
        academicLevel: "",
        studentIdDocument: null,
        parentIdDocument: null,
        academicResults: null
      });
      setSelectedUniversities([]);
      setSelectedCourses([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error submitting your application. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen backdrop-blur-md bg-blue-900/80 text-white">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">University Application</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-white/10 bg-blue-900/40 backdrop-blur-md text-white">
          <CardHeader>
            <CardTitle className="text-white">Select Universities (Max 7)</CardTitle>
            <CardDescription className="text-blue-200">Selected: {selectedUniversities.length}/7</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {universities.map((university) => (
                <div key={university} className="flex items-center space-x-2 mb-4 hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                  <Checkbox
                    id={`university-${university}`}
                    checked={selectedUniversities.includes(university)}
                    onCheckedChange={() => handleUniversityToggle(university)}
                    className="border-white/20"
                  />
                  <label
                    htmlFor={`university-${university}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {university}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-blue-900/40 backdrop-blur-md text-white">
          <CardHeader>
            <CardTitle className="text-white">Select Courses (Max 7)</CardTitle>
            <CardDescription className="text-blue-200">Selected: {selectedCourses.length}/7</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {courses.map((course) => (
                <div key={course} className="flex items-center space-x-2 mb-4 hover:bg-white/10 p-2 rounded-lg transition-all duration-300">
                  <Checkbox
                    id={`course-${course}`}
                    checked={selectedCourses.includes(course)}
                    onCheckedChange={() => handleCourseToggle(course)}
                    className="border-white/20"
                  />
                  <label
                    htmlFor={`course-${course}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {course}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-2xl mx-auto border border-white/10 bg-blue-900/40 backdrop-blur-md text-white">
        <CardHeader>
          <CardTitle className="text-white">Personal Information</CardTitle>
          <CardDescription className="text-blue-200">Please fill in your details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="bg-blue-900/40 border-white/10 text-white placeholder:text-white/50 focus:border-white/20 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicLevel">Academic Level</Label>
              <Select
                value={formData.academicLevel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, academicLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your academic level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matric">Matric</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="degree">Degree</SelectItem>
                  <SelectItem value="postgraduate">Postgraduate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentIdDocument">Student ID Document</Label>
              <Input
                id="studentIdDocument"
                name="studentIdDocument"
                type="file"
                onChange={handleFileUpload}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentIdDocument">Parent/Guardian ID Document</Label>
              <Input
                id="parentIdDocument"
                name="parentIdDocument"
                type="file"
                onChange={handleFileUpload}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicResults">Academic Results</Label>
              <Input
                id="academicResults"
                name="academicResults"
                type="file"
                onChange={handleFileUpload}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 transition-all duration-300" 
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityApplication;