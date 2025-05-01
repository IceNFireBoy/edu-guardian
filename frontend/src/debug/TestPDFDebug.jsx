import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import PDFViewer from '../components/notes/PDFViewer';
import ErrorBoundary from '../components/ErrorBoundary';

// Test component with various edge cases
const TestPDFDebug = () => {
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
          </ul>
          
          <div className="mt-6">
            <Link 
              to="/my-notes" 
              className="inline-block px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
            >
              Back to App
            </Link>
          </div>
        </div>
        
        {/* Test result display */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <Routes>
            <Route 
              path="/valid" 
              element={
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" 
                      noteTitle="Valid Test PDF" 
                    />
                  </div>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/null-url" 
              element={
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl={null} 
                      noteTitle="Test with Null URL" 
                    />
                  </div>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/empty-url" 
              element={
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="" 
                      noteTitle="Test with Empty URL" 
                    />
                  </div>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/invalid-url" 
              element={
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="https://invalid-url-that-will-fail.pdf" 
                      noteTitle="Test with Invalid URL" 
                    />
                  </div>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/null-title" 
              element={
                <ErrorBoundary>
                  <div className="h-96 border border-gray-200 dark:border-gray-700 rounded">
                    <PDFViewer 
                      noteUrl="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" 
                      noteTitle={null} 
                    />
                  </div>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/" 
              element={
                <div className="text-center p-8 bg-gray-100 dark:bg-gray-700 rounded">
                  <p>Select a test case from the left to begin testing</p>
                </div>
              } 
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TestPDFDebug; 