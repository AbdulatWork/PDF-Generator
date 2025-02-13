import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BulkGenerator = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file.");
      return;
    }

    setProcessing(true);
    setMessage("Processing...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/bulk-generate", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Bulk generation successful! Emails sent.");
      } else {
        setMessage(result.error || "Bulk generation failed.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred during bulk processing.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 
      "name,student_id,email,criteria,max_grade,grades,feedback\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_csv.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold">Bulk Generator</h1>
      <p className="text-lg mt-4">Upload a CSV file with student data.</p>

      <button
        onClick={handleDownloadTemplate}
        className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white"
      >
        Download Template
      </button>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mt-4 border rounded px-3 py-2"
      />

      <button
        onClick={handleUpload}
        className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white"
        disabled={processing}
      >
        {processing ? "Processing..." : "Generate & Send PDFs"}
      </button>

      {message && <p className="mt-4 text-lg">{message}</p>}

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="mt-4 text-black py-2 px-4 rounded-xl border-2 hover:bg-black hover:text-white"
      >
        Back
      </button>
    </div>
  );
};

export default BulkGenerator;
