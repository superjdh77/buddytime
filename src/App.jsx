import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getProfile, isSessionConfirmed } from './utils/auth'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import StartRound from './pages/StartRound'
import LiveScore from './pages/LiveScore'
import WatchLive from './pages/WatchLive'
import RoomJoin from './pages/RoomJoin'
import WatchRoom from './pages/WatchRoom'
import MyRounds from './pages/MyRounds'
import GroupBoard from './pages/GroupBoard'
import InstallPrompt from './components/InstallPrompt'

function RequireAuth({ children }) {
  return (getProfile() && isSessionConfirmed()) ? children : <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/start" element={<RequireAuth><StartRound /></RequireAuth>} />
        <Route path="/live/:roundId" element={<RequireAuth><LiveScore /></RequireAuth>} />
        <Route path="/watch/:roundId" element={<WatchLive />} />
        <Route path="/room/:code" element={<RoomJoin />} />
        <Route path="/watchroom/:code" element={<WatchRoom />} />
        <Route path="/rounds" element={<RequireAuth><MyRounds /></RequireAuth>} />
        <Route path="/group" element={<RequireAuth><GroupBoard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <InstallPrompt />
    </BrowserRouter>
  )
}
