import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";

const PdfHistory = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [wordToPdfFiles, setWordToPdfFiles] = useState([]);
  const [templatePdfs, setTemplatePdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchPdfs = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/pdfs/${user.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // Separate PDFs based on type
        setWordToPdfFiles(data.word_to_pdf || []);
        setTemplatePdfs(data.template_pdfs || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPdfs();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full bg-gray-800 text-white py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/")} className="text-white hover:text-gray-300">
            ← Back
          </button>
          <h1 className="text-xl font-bold">PDF History</h1>
        </div>
        <UserButton />
      </nav>

      <div className="flex flex-col items-center p-6 w-full">
        <h1 className="text-2xl font-bold mb-8">Your PDF History</h1>

        {loading ? (
          <p>Loading PDFs...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <>
            {/* Word to PDF Converted Files */}
            <div className="w-full max-w-4xl mb-8 p-6 border rounded-lg shadow-lg bg-gray-100">
              <h2 className="text-xl font-semibold mb-4">Word to PDF Converted Files</h2>
              {wordToPdfFiles.length > 0 ? (
                <ul>
                  {wordToPdfFiles.map((pdf) => (
                    <li key={pdf.pdf_id} className="mb-2">
                      <a
                        href={`http://127.0.0.1:5000/download/${pdf.pdf_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {pdf.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-center">No converted Word documents found.</p>
              )}
            </div>

            {/* Template-Populated PDFs */}
            <div className="w-full max-w-4xl p-6 border rounded-lg shadow-lg bg-gray-100">
              <h2 className="text-xl font-semibold mb-4">Template-Populated PDFs</h2>
              {templatePdfs.length > 0 ? (
                <ul>
                  {templatePdfs.map((pdf) => (
                    <li key={pdf.pdf_id} className="mb-2">
                      <a
                        href={`http://127.0.0.1:5000/download/${pdf.pdf_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {pdf.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-center">No template-populated PDFs found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PdfHistory;
