import React, { FC } from 'react';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
// import PDFViewer from '../components/notes/PDFViewer'; // Old path
import PDFViewer from '../features/notes/PDFViewer'; // Corrected path to TSX version
import ErrorBoundary from '../components/ErrorBoundary'; // Already TSX

// Type for the sample note (could also be imported if Note type is suitable and available)
interface SampleNote {
  title: string | null; // Allow null for test case
  description: string;
  fileUrl: string | null; // Allow null for test case
  subject: string;
  grade: string;
  semester: string;
  quarter: string;
  topic: string;
  fileType: string;
  tags: string[];
  _id?: string; // Optional, added by saveTestNote
  asset_id?: string; // Optional, added by saveTestNote
}

// Test component with various edge cases
const TestPDFDebug: FC = () => {
  const navigate = useNavigate();
  
  const sampleNote: SampleNote = {
    title: "Test PDF With Description",
    description: "This is a test description that should be visible in the note card and note detail view.",
    fileUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    subject: "Computer Science",
    grade: "12",
    semester: "1",
    quarter: "1",
    topic: "Testing",
    fileType: "pdf",
    tags: ["test", "pdf", "debug"]
  };
  
  const saveTestNote = () => {
    try {
      const existingNotesJson = localStorage.getItem('notes') || '[]';
      let existingNotes: SampleNote[] = [];
      try {
        existingNotes = JSON.parse(existingNotesJson);
        if (!Array.isArray(existingNotes)) { // Basic validation
          existingNotes = [];
        }
      } catch (parseError) {
        console.error('Error parsing existing notes from localStorage:', parseError);
        existingNotes = []; // Reset if parsing fails
      }
      
      const noteWithId: SampleNote = {
        ...sampleNote,
        _id: `test-note-${Date.now()}`,
        asset_id: `test-asset-${Date.now()}`
      };
      
      localStorage.setItem('notes', JSON.stringify([...existingNotes, noteWithId]));
      alert('Test note added! Go to My Notes to see it.');
    } catch (err: any) {
      console.error('Error saving test note:', err);
      alert('Failed to save test note: ' + err.message);
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">PDF Viewer Debug Tests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test case buttons */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/debug/test-pdf/valid" 
                className="inline-block px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
              >
                Test Valid PDF
              </Link>
            </li>
            <li>
              <Link 
                to="/debug/test-pdf/null-url" 
                className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded"
              >
                Test Null URL
              </Link>
            </li>
            <li>
              <Link 
                to="/debug/test-pdf/empty-url" 
                className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded"
              >
                Test Empty URL
              </Link>
            </li>
            <li>
              <Link 
                to="/debug/test-pdf/invalid-url" 
                className="inline-block px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded"
              >
                Test Invalid URL
              </Link>
            </li>
            <li>
              <Link 
                to="/debug/test-pdf/null-title" 
                className="inline-block px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded"
              >
                Test Null Title
              </Link>
            </li>
            <li>
              <button 
                onClick={saveTestNote}
                className="inline-block px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded"
              >
                Add Test Note with Description
              </button>
            </li>
          </ul>
          
          <div className="mt-6">
            <button 
              onClick={() => navigate('/my-notes')}
              className="inline-block px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
            >
              Back to App
            </button>
          </div>
        </div>
        
        {/* Test result display */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <Routes>
            <Route 
              path="valid" 
              element={(
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" 
                      noteTitle="Valid Test PDF" 
                    />
                  </div>
                </ErrorBoundary>
              )} 
            />
            <Route 
              path="null-url" 
              element={(
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl={null} 
                      noteTitle="Test with Null URL" 
                    />
                  </div>
                </ErrorBoundary>
              )} 
            />
            <Route 
              path="empty-url" 
              element={(
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="" 
                      noteTitle="Test with Empty URL" 
                    />
                  </div>
                </ErrorBoundary>
              )} 
            />
            <Route 
              path="invalid-url" 
              element={(
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="https://invalid-url-that-will-fail.pdf" 
                      noteTitle="Test with Invalid URL" 
                    />
                  </div>
                </ErrorBoundary>
              )} 
            />
            <Route 
              path="null-title" 
              element={(
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" 
                      noteTitle={null} 
                    />
                  </div>
                </ErrorBoundary>
              )} 
            />
            <Route path="*" element={<p className="text-gray-500">Select a test case from the left.</p>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TestPDFDebug; 