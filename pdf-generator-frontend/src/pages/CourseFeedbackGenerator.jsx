import React, { useState } from 'react';
import { UserButton, useUser } from "@clerk/clerk-react";

const CourseFeedbackGenerator = () => {
  const { user } = useUser(); // Get the current user from Clerk
  const [templateValues, setTemplateValues] = useState({
    student_name: '',
    student_id: '',
    criteria: '',
    max_grade: '',
    grades: '',
    feedback: ''
  });

  const [generatedFeedback, setGeneratedFeedback] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfId, setPdfId] = useState(''); // ✅ Define pdfId state
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateValues(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      console.error('No user found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id, // Move User ID to the body
          templateValues
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setGeneratedFeedback(result.feedback);
        setPdfId(result.pdf_id); // ✅ Store the pdf_id in state
        setPdfUrl(`http://127.0.0.1:5000/download/${result.pdf_id}`); // ✅ Construct correct PDF URL
      } else {
        console.error('Failed to generate feedback:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full bg-gray-800 text-white py-4 px-6 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Course Feedback Generator</h1>
        <UserButton />
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Name</label>
                <input
                  type="text"
                  name="student_name"
                  value={templateValues.student_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="text"
                  name="student_id"
                  value={templateValues.student_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Criteria</label>
                <textarea
                  name="criteria"
                  value={templateValues.criteria}
                  onChange={handleInputChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter assessment criteria..."
                  required
                />
              </div>
            </div>

            {/* Grades and Feedback */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Grade</label>
                <input
                  type="number"
                  name="max_grade"
                  value={templateValues.max_grade}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Grades</label>
                <textarea
                  name="grades"
                  value={templateValues.grades}
                  onChange={handleInputChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter grades..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback</label>
                <textarea
                  name="feedback"
                  value={templateValues.feedback}
                  onChange={handleInputChange}
                  rows="4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter detailed feedback..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || !user}
              className="px-6 py-2 text-black rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Feedback'}
            </button>
          </div>
        </form>

        {generatedFeedback && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Generated Feedback</h2>
            <div className="whitespace-pre-wrap">{generatedFeedback}</div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="mt-4 inline-block px-6 py-2 text-black rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
              >
                Download PDF
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseFeedbackGenerator;