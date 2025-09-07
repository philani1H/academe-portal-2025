import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ResearchPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Research & Development</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our commitment to educational excellence through continuous research and innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Educational Technology</CardTitle>
                <CardDescription>
                  Researching the latest educational technologies to enhance learning experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  We continuously explore new technologies and methodologies to improve our teaching platform and student outcomes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Analytics</CardTitle>
                <CardDescription>
                  Analyzing student performance data to optimize learning paths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our research team analyzes learning patterns to develop personalized educational approaches for each student.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Curriculum Development</CardTitle>
                <CardDescription>
                  Developing and refining curriculum based on industry needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  We work closely with industry experts to ensure our curriculum remains relevant and up-to-date.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
                <CardDescription>
                  Researching methods to increase student engagement and motivation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our studies focus on understanding what motivates students and how to maintain their interest in learning.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assessment Methods</CardTitle>
                <CardDescription>
                  Developing innovative assessment techniques for better evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  We research and implement new assessment methods that provide more accurate and meaningful feedback.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
                <CardDescription>
                  Ensuring our platform is accessible to all learners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our research focuses on making education accessible to students with diverse learning needs and abilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResearchPage;