import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateCasePage from './pages/CreateCasePage'
import WaitingPage from './pages/WaitingPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-200">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateCasePage />} />
          <Route path="/waiting" element={<WaitingPage />} />
          <Route path="/game/:caseId" element={<GamePage />} />
          <Route path="/result/:caseId" element={<ResultPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App