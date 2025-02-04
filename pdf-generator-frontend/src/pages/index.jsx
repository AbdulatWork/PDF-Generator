import React, { useState,useRef } from "react";
import { UserButton } from "@clerk/clerk-react";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [populatedTemplate, setPopulatedTemplate] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const fileInputRef = useRef(null);
  const [ccEmails, setCcEmails] = useState("");

const handleCcEmailChange = (event) => {
  setCcEmails(event.target.value);
};

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("template", template);

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
        setPdfUrl(`http://127.0.0.1:5000${result.pdf_url}`);
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
  
    if (!pdfUrl) {
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
          ccEmails: ccEmails.split(",").map(email => email.trim()), // Convert to array
          pdf_filename: pdfUrl.split("/").pop(),
        }),
      });
  
      const result = await response.json();
      console.log(result);
  
      if (response.ok) {
        setEmailStatus("Email sent successfully!");
        setMessage("");
      } else {
        setEmailStatus(result.error || "Failed to send email.");
      }
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
          className="mt-4 mb-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
        >
          Upload File
        </button>

        {/* Display Selected File */}
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

        {/* Message Display */}
        {message && <p className="mt-4 text-lg">{message}</p>}

        {/* Populated Template Display */}
        {populatedTemplate && (
          <div className="mt-6 p-4 border rounded-lg shadow-lg bg-gray-50 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Generated Document</h2>
            <pre className="whitespace-pre-wrap text-gray-800">{populatedTemplate}</pre>
          </div>
        )}

        {/* PDF Download Link */}
        {pdfUrl && (
          <a
            href={pdfUrl}
            download
            className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
          >
            Download PDF
          </a>
        )}

        {/* Email Input and Send Button */}
{pdfUrl && (
  <div className="mt-6 w-full max-w-md">
    {/* Recipient Email Input */}
    <input
      type="email"
      placeholder="Enter recipient's email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="mb-4 border rounded px-3 py-2 w-full"
    />
    
    {/* CC Email Input */}
    <input
      type="text"
      placeholder="Enter CC emails (comma-separated)"
      value={ccEmails}
      onChange={handleCcEmailChange}
      className="mb-4 border rounded px-3 py-2 w-full"
    />

    {/* Send Email Button */}
    <div className="flex items-center justify-center">
      <button
        onClick={handleSendEmail}
        className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white hover:cursor-pointer"
      >
        Send Email
      </button>
    </div>
  </div>
)}


        {/* Email Status Notification */}
        {emailStatus && <p className="mt-4 text-lg text-blue-600">{emailStatus}</p>}
      </div>
    </div>
  );
};

export default FileUpload;
