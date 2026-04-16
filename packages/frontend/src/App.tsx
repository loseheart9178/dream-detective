import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateCasePage from './pages/CreateCasePage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-200">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateCasePage />} />
          <Route path="/game/:caseId" element={<GamePage />} />
          <Route path="/result/:caseId" element={<ResultPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App