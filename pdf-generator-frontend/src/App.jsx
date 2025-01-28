
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import FileUpload from './pages/index'
import './App.css'

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileUpload/>} />
      </Routes>
    </Router>
  )
}

export default App
