import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPageRoute } from './pages/LandingPageRoute';
import { ReferenceCheckingPage } from './pages/ReferenceCheckingPage';
import { PaperToMarkdownPage } from './pages/PaperToMarkdownPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/Toast';
import { UNAVAILABLE_FEATURE_MESSAGE } from './routes/constants';
import { TOOLS } from './routes/toolCatalog';

function UnavailableToolRedirect() {
  return <Navigate to="/" replace state={{ flashMessage: UNAVAILABLE_FEATURE_MESSAGE }} />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPageRoute />} />
        <Route
          path="/reference-checking"
          element={
            <ProtectedRoute>
              <ReferenceCheckingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/paper-to-markdown"
          element={
            <ProtectedRoute>
              <PaperToMarkdownPage />
            </ProtectedRoute>
          }
        />
        {TOOLS.filter((t) => !t.available).map((tool) => (
          <Route key={tool.id} path={tool.path} element={<UnavailableToolRedirect />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}
