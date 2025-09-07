import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Search, Filter } from 'lucide-react';

const LibraryPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Digital Library</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access our comprehensive collection of educational resources, study materials, and reference documents
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Resource Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">Study Materials</CardTitle>
                    <CardDescription>Textbooks, notes, and study guides</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive study materials for all subjects and grade levels
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">500+ Resources</span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">Practice Tests</CardTitle>
                    <CardDescription>Mock exams and practice questions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Practice tests and sample questions for exam preparation
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">200+ Tests</span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle className="text-lg">Reference Books</CardTitle>
                    <CardDescription>Dictionaries, encyclopedias, and references</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Digital reference materials and academic resources
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">150+ References</span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-orange-600" />
                  <div>
                    <CardTitle className="text-lg">Video Lectures</CardTitle>
                    <CardDescription>Recorded lectures and tutorials</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Video content from our expert tutors and guest lecturers
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">300+ Videos</span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-red-600" />
                  <div>
                    <CardTitle className="text-lg">Research Papers</CardTitle>
                    <CardDescription>Academic papers and research articles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Academic research papers and scholarly articles
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">100+ Papers</span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-indigo-600" />
                  <div>
                    <CardTitle className="text-lg">Interactive Tools</CardTitle>
                    <CardDescription>Calculators, simulators, and tools</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Interactive educational tools and calculators
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">50+ Tools</span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Resources */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mathematics Mastery Guide</CardTitle>
                  <CardDescription>Complete guide to advanced mathematics concepts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    A comprehensive resource covering algebra, calculus, geometry, and statistics with practice problems and solutions.
                  </p>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Science Laboratory Manual</CardTitle>
                  <CardDescription>Complete laboratory procedures and experiments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Step-by-step laboratory procedures for physics, chemistry, and biology experiments with safety guidelines.
                  </p>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LibraryPage;