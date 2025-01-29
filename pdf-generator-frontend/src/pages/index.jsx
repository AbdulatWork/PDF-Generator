import React, { useState } from "react";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [template, setTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [populatedTemplate, setPopulatedTemplate] = useState("");
  const [pdfUrl, setPdfUrl] = useState(""); // State to store the PDF download link
  const [email, setEmail] = useState(""); // State to store the email address
  const [emailStatus, setEmailStatus] = useState(""); // State to show email status

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleTemplateChange = (event) => {
    setTemplate(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
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
        setPopulatedTemplate(result.populated_template || "");
        setPdfUrl(`http://127.0.0.1:5000${result.pdf_url}`); // Store the PDF URL
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
          pdf_filename: pdfUrl.split("/").pop(), // Extract the filename from the URL
        }),
      });

      const result = await response.json();
      console.log(result); // Log the backend response

      if (response.ok) {
        setEmailStatus("Email sent successfully!");
        setMessage(""); // Clear general messages if any
      } else {
        setEmailStatus(result.error || "Failed to send email.");
      }
    } catch (error) {
      console.error("Error:", error);
      setEmailStatus("An error occurred while sending the email.");
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

      {/* PDF Download Link */}
      {pdfUrl && (
        <a
          href={pdfUrl}
          download
          className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Download PDF
        </a>
      )}

      {/* Email Input and Send Button */}
      {pdfUrl && (
        <div className="mt-6 w-full max-w-md">
          <input
            type="email"
            placeholder="Enter recipient's email"
            value={email}
            onChange={handleEmailChange}
            className="mb-4 border rounded px-3 py-2 w-full"
          />
          <button
            onClick={handleSendEmail}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Send Email
          </button>
        </div>
      )}

      {/* Email Status Notification */}
      {emailStatus && <p className="mt-4 text-lg text-blue-600">{emailStatus}</p>}
    </div>
  );
};

export default FileUpload;
