import React, { useState, useRef } from "react";
import { UserButton, useUser } from "@clerk/clerk-react"; // Import useUser to get Clerk user ID
import { useNavigate } from "react-router-dom";

const FileUpload = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // Get authenticated user from Clerk
  const [file, setFile] = useState(null);
  const [template, setTemplate] = useState("");
  const [templateValues, setTemplateValues] = useState({});
  const [message, setMessage] = useState("");
  const [populatedTemplate, setPopulatedTemplate] = useState("");
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfId, setPdfId] = useState("");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const fileInputRef = useRef(null);
  const [ccEmails, setCcEmails] = useState("");

  const navigateToWordConverter = () => {
    navigate("/word-to-pdf");
  };

  const navigateToBulkGenerator = () => {
    navigate("/bulk-generator");
  };

  const handleViewHistory = () => {
    navigate("/pdf-history");
  };

  const navigateToCourseFeedback = () => {
    navigate("/course-feedback");
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };
  const handleCcEmailChange = (event) => {
    setCcEmails(event.target.value);
  };


  const handleInputChange = (event, field) => {
    setTemplateValues((prevValues) => ({
      ...prevValues,
      [field]: event.target.value,
    }));
  };

  const handleTemplateChange = (event) => {
    setTemplate(event.target.value);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    if (!template) {
      setMessage("Please select a template.");
      return;
    }

    if (!user) {
      setMessage("User authentication required.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("template", template);
    formData.append("user_id", user.id); // Send Clerk user ID

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log(result);

      if (response.ok) {
        setMessage(result.message || "Upload successful!");
        setPopulatedTemplate(result.populated_template || "");
        setPdfUrl("http://127.0.0.1:5000/download/${result.pdf_id}"); // ✅ Use pdfId instead of filename
        setPdfId(result.pdf_id);
      } else {
        setMessage(result.error || "Upload failed.");
        setPopulatedTemplate("");
        setPdfUrl("");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred during upload.");
      setPopulatedTemplate("");
      setPdfUrl("");
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      setEmailStatus("Please enter an email address.");
      return;
    }
  
    if (!pdfId) {  // ✅ Use pdfId instead of extracting from URL
      setEmailStatus("Please generate a document first.");
      return;
    }
  
    try {
      const response = await fetch("http://127.0.0.1:5000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          ccEmails: ccEmails.split(",").map((email) => email.trim()), 
          pdf_id: pdfId,  // ✅ Send ObjectID instead of filename
        }),
      });
  
      const result = await response.json();
      setEmailStatus(result.message || result.error);
    } catch (error) {
      console.error("Error:", error);
      setEmailStatus("An error occurred while sending the email.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-gray-800 text-white py-4 px-6 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">PDF Generator</h1>
        <UserButton />
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center p-6">
        <h1 className="text-2xl font-bold mb-4">Upload a Dataset</h1>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={handleViewHistory}
            className="text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
          >
            View PDF History
          </button>

          {/* File Upload Button */}
          <input
            type="file"
            accept=".csv, .json, .xml"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
          >
            Upload File
          </button>

          {/* Word to PDF Converter Button */}
          <button
            onClick={navigateToWordConverter}
            className="text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
          >
            Word to PDF Converter
          </button>
          <button
            onClick={navigateToBulkGenerator}
            className="text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
          >
            Bulk Generator
          </button>
          {/* <button
            onClick={navigateToCourseFeedback}
            className="text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
          >
            Generate Course Feedback
          </button> */}
        </div>

        {file && <p className="mt-2 text-lg">Selected File: {file.name}</p>}

        {/* Template Selection */}
        <select
          value={template}
          onChange={handleTemplateChange}
          className="mb-4 border rounded px-3 py-2 w-64"
        >
          <option value="">Select a Template</option>
          <option value="business_letter">Business Letter</option>
          <option value="coursework_feedback">Coursework Feedback</option>
          <option value="invoice">Invoice</option>
        </select>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
        >
          Generate
        </button>

        {message && <p className="mt-4 text-lg">{message}</p>}

        {populatedTemplate && (
          <div className="mt-6 p-4 border rounded-lg shadow-lg bg-gray-50 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Generated Document</h2>
            <pre className="whitespace-pre-wrap text-gray-800">{populatedTemplate}</pre>
          </div>
        )}

        {pdfUrl && (
          <a
            href={pdfUrl}
            download
            className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
          >
            Download PDF
          </a>
        )}

        {pdfUrl && (
          <div className="mt-6 w-full max-w-md">
            <input
              type="email"
              placeholder="Enter recipient's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 border rounded px-3 py-2 w-full"
            />
            <input
              type="text"
              placeholder="Enter CC emails (comma-separated)"
              value={ccEmails}
              onChange={handleCcEmailChange}
              className="mb-4 border rounded px-3 py-2 w-full"
            />
            <button
              onClick={handleSendEmail}
              className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
            >
              Send Email
            </button>
          </div>
        )}
        {emailStatus && <p className="mt-4 text-lg text-blue-600">{emailStatus}</p>}
      </div>
    </div>
  );
};

export default FileUpload;
