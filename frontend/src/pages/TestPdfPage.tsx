import React, { FC } from 'react';
// import PDFViewer from '../components/notes/PDFViewer'; // Old path
import PDFViewer from '../features/notes/PDFViewer'; // Corrected path to TSX version

const TestPdfPage: FC = () => {
  const hardcodedUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  const hardcodedTitle = "Hardcoded Test PDF";
  const hardcodedId = "test-pdf-id-hardcoded";
  
  console.log('[TestPdfPage] Rendering PDFViewer with hardcoded URL:', hardcodedUrl);
  
  return (
    <div style={{ border: '2px solid green', padding: '20px', height: '100vh' }}>
      <h1>PDF Test Page</h1>
      <p>Attempting to load: {hardcodedUrl}</p>
      <div style={{ height: '80vh', border: '1px solid red' }}>
        <PDFViewer
          fileUrl={hardcodedUrl}
          noteTitle={hardcodedTitle}
          noteId={hardcodedId}
        />
      </div>
    </div>
  );
};

export default TestPdfPage; 