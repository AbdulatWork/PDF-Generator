import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser } from "@clerk/clerk-react";

const WordToPdfConverter = () => {
  const { user } = useUser(); // Get Clerk user
  const [wordFiles, setWordFiles] = useState([]);
  const [convertedPdfUrls, setConvertedPdfUrls] = useState([]);
  const [status, setStatus] = useState('');
  const [pdfId, setPdfId] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => 
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (validFiles.length < files.length) {
      setStatus('Some files were skipped. Please select only Word documents (.doc or .docx)');
    }

    if (validFiles.length > 0) {
      setWordFiles(validFiles);
      setStatus('');
    } else {
      setStatus('Please select valid Word documents (.doc or .docx)');
      setWordFiles([]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleConvert = async () => {
    if (wordFiles.length === 0) {
      setStatus('Please select Word files first');
      return;
    }

    if (!user) {
      setStatus('User authentication required.');
      return;
    }

    setStatus('Converting...');
    const urls = [];

    try {
      for (const file of wordFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id); // Send Clerk user ID

        const response = await fetch('http://127.0.0.1:5000/convert-word-to-pdf', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        console.log(result);
        if (response.ok) {
          urls.push({
            url: `http://127.0.0.1:5000/download/${result.pdf_id}`,
            fileName: file.name.replace(/\.(doc|docx)$/, '.pdf')
          });
          setPdfId(result.pdf_id);
        } else {
          setStatus(`Error converting ${file.name}: ${result.error}`);
          return;
        }
      }

      setConvertedPdfUrls(urls);
      console.log(urls);
      setStatus('All conversions successful!');
    } catch (error) {
      console.error('Error:', error);
      setStatus('An error occurred during conversion');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full bg-gray-800 text-white py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-gray-300"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Word to PDF Converter</h1>
        </div>
        <UserButton />
      </nav>

      <div className="flex flex-col items-center p-6">
        <h1 className="text-2xl font-bold mb-8">Convert Word to PDF</h1>
        
        <input
          type="file"
          accept=".doc,.docx"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />

        <button
          onClick={handleUploadClick}
          className="mb-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
        >
          Select Word Files
        </button>

        {wordFiles.length > 0 && (
          <div className="mb-4">
            <p className="text-lg mb-2">Selected files:</p>
            <ul className="list-disc pl-5">
              {wordFiles.map((file, index) => (
                <li key={index} className="text-md">{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={wordFiles.length === 0}
          className={`text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer ${
            wordFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Convert to PDF
        </button>

        {status && (
          <p className="mt-4 text-lg text-blue-600">{status}</p>
        )}

        {convertedPdfUrls.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {convertedPdfUrls.map((pdf, index) => (
              <a
                key={index}
                href={pdf.url}
                download={pdf.fileName}
                className="text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
              >
                Download {pdf.fileName}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordToPdfConverter;
