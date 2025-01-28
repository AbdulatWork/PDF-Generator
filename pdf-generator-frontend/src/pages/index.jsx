import React, { useState } from "react";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [populatedTemplate, setPopulatedTemplate] = useState(""); // State to store the populated template

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleTemplateChange = (event) => {
    setTemplate(event.target.value);
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
      console.log(result); // Log the backend response

      if (response.ok) {
        setMessage(result.message || "Upload successful!");
        setPopulatedTemplate(result.populated_template || ""); // Store the populated template
      } else {
        setMessage(result.error || "Upload failed.");
        setPopulatedTemplate("");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred during upload.");
      setPopulatedTemplate("");
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Upload a Dataset</h1>

      {/* File Input */}
      <input
        type="file"
        accept=".csv, .json, .xml"
        onChange={handleFileChange}
        className="mb-4"
      />

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
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Upload
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
    </div>
  );
};

export default FileUpload;
