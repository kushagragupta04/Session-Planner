import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizerLayout from './components/OrganizerLayout';
import Overview from './pages/organizer/Overview';
import Tracks from './pages/organizer/Tracks';
import Rooms from './pages/organizer/Rooms';
import Speakers from './pages/organizer/Speakers';
import Sessions from './pages/organizer/Sessions';
import SchedulePlanner from './pages/organizer/SchedulePlanner';
import Analytics from './pages/organizer/Analytics';
import Notifications from './pages/organizer/Notifications';
import SpeakerLayout from './components/SpeakerLayout';
import SpeakerDashboard from './pages/speaker/Dashboard';
import MySessions from './pages/speaker/MySessions';
import Feedback from './pages/speaker/Feedback';
import AttendeeLayout from './components/AttendeeLayout';
import AttendeeDashboard from './pages/attendee/Dashboard';
import Discover from './pages/attendee/Discover';
import Schedule from './pages/attendee/Schedule';
import Saved from './pages/attendee/Saved';
import Recommendations from './pages/attendee/Recommendations';
import SpeakersView from './pages/attendee/Speakers';
import AttendeeNotifications from './pages/attendee/Notifications';
import Ratings from './pages/attendee/Ratings';
import Resources from './pages/attendee/Resources';
import Placeholder from './pages/organizer/Placeholder';

function Home() {
  const { user, logout } = useAuth();
  
  if (user?.role === 'ADMIN') {
    return <Navigate to="/organizer" />;
  }

  if (user?.role === 'SPEAKER') {
    return <Navigate to="/speaker" />;
  }

  if (user?.role === 'ATTENDEE') {
    return <Navigate to="/attendee" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-800 tracking-tight">
              DevOps <span className="text-slate-900 font-black">Planner</span>
            </h1>
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">{user?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 sm:px-6 sm:py-2 rounded-md border border-slate-200 text-sm font-bold transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <header className="mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">Dashboard</h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-medium leading-relaxed">
            Welcome to the DevOps Conference Session Planner. As a <span className="text-blue-600 font-bold">{user?.role}</span>, you can manage your schedule and interact with conference tracks.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="group bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 hover:border-blue-600 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Sessions</h3>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">Explore all tracks including CI/CD, Containers, and Monitoring sessions.</p>
          </div>
          
          <div className="group bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 hover:border-blue-600 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Speakers</h3>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">Check out speaker bios and expertise mappings for each session.</p>
          </div>

          <div className="group bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 hover:border-blue-600 transition-all cursor-pointer md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">Schedule</h3>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">View intelligent time slot allocations and buffer times between tracks.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center font-bold">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center font-bold">Loading...</div>;
  if (!user || !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      
      {/* Organizer Routes */}
      <Route path="/organizer" element={
        <RoleRoute roles={['ADMIN']}>
          <OrganizerLayout>
            <Outlet />
          </OrganizerLayout>
        </RoleRoute>
      }>
        <Route index element={<Overview />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="speakers" element={<Speakers />} />
        <Route path="tracks" element={<Tracks />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="schedule" element={<SchedulePlanner />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      
      {/* Speaker Routes */}
      <Route path="/speaker" element={
        <RoleRoute roles={['SPEAKER']}>
          <SpeakerLayout>
            <Outlet />
          </SpeakerLayout>
        </RoleRoute>
      }>
        <Route index element={<SpeakerDashboard />} />
        <Route path="sessions" element={<MySessions />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>

      {/* Attendee Routes */}
      <Route path="/attendee" element={
        <RoleRoute roles={['ATTENDEE']}>
          <AttendeeLayout>
            <Outlet />
          </AttendeeLayout>
        </RoleRoute>
      }>
        <Route index element={<AttendeeDashboard />} />
        <Route path="discover" element={<Discover />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="saved" element={<Saved />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="speakers" element={<SpeakersView />} />
        <Route path="notifications" element={<AttendeeNotifications />} />
        <Route path="ratings" element={<Ratings />} />
        <Route path="resources" element={<Resources />} />
      </Route>
    </Routes>
  );
}

export default App;
