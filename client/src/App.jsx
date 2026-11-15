import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import AuthForm from './components/auth/AuthForm';
import CatalogPage from './pages/CatalogPage';
import CabinetPage from './pages/CabinetPage';
import AdminPage from './pages/AdminPage';
import CourseDetailPage from './pages/CourseDetailPage';

function MainContent() {
  const [activePage, setActivePage] = useState('catalog');
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const renderPage = () => {
    switch (activePage) {
      case 'catalog':
        return <CatalogPage onSelectCourse={(courseId) => { setSelectedCourseId(courseId); setActivePage('course-detail'); }} />;
      case 'course-detail':
        if (selectedCourseId !== null) {
          return <CourseDetailPage courseId={selectedCourseId} onBack={() => { setSelectedCourseId(null); setActivePage('catalog'); }} />;
        }
        return <CatalogPage onSelectCourse={(courseId) => { setSelectedCourseId(courseId); setActivePage('course-detail'); }} />;
      case 'cabinet':
        return <CabinetPage />;
      case 'admin':
        return <AdminPage />;
      case 'auth':
        return (
          <div className="flex justify-center items-center py-12 px-4">
            <AuthForm onSuccess={() => setActivePage('catalog')} />
          </div>
        );
      default:
        return <CatalogPage onSelectCourse={(courseId) => { setSelectedCourseId(courseId); setActivePage('course-detail'); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activePage={activePage} onNavigate={(page) => {
        if (page === 'catalog') setSelectedCourseId(null);
        setActivePage(page);
      }} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }}
      />
      <MainContent />
    </AuthProvider>
  );
}



