
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { SignIn,  } from '@clerk/clerk-react'
import PdfHistory from './pages/PDFHistory';
import WordToPdfConverter from './pages/WordToPDFConverter';
import FileUpload from './pages/index'
import './App.css'



export default function App() {
  return (
    <div>
      <SignedOut>
        {/* Center sign-in on the screen */}
        <div className="h-screen flex items-center justify-center">
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>
        {/* Signed-in content should start from the top */}
        <Router>
          <Routes>
            <Route path="/" element={<FileUpload />} />
            <Route path="/word-to-pdf" element={<WordToPdfConverter />} />
            <Route path="/pdf-history" element={<PdfHistory />} />
          </Routes>
        </Router>
      </SignedIn>
    </div>
  );
}
