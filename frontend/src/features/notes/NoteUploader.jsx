import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FaArrowRight, FaArrowLeft, FaCloudUploadAlt, FaCheckCircle, FaTimesCircle, FaFilePdf, FaImage } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import { useStreak } from '../../hooks/useStreak';
import { toast } from 'react-hot-toast';
import { uploadNote } from '../../api/notes';
import { debug } from '../../components/DebugPanel';

// Form step components
const Step1Form = ({ register, errors, subjects }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2">Grade Level</label>
      <select 
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('grade', { required: 'Grade is required' })}
      >
        <option value="">Select Grade</option>
        <option value="11">Grade 11</option>
        <option value="12">Grade 12</option>
      </select>
      {errors.grade && <p className="text-red-500 mt-1">{errors.grade.message}</p>}
    </div>
    
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2">Semester</label>
      <select 
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('semester', { required: 'Semester is required' })}
      >
        <option value="">Select Semester</option>
        <option value="1">1st Semester</option>
        <option value="2">2nd Semester</option>
      </select>
      {errors.semester && <p className="text-red-500 mt-1">{errors.semester.message}</p>}
    </div>
    
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2">Quarter</label>
      <select 
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('quarter', { required: 'Quarter is required' })}
      >
        <option value="">Select Quarter</option>
        <option value="1">Q1</option>
        <option value="2">Q2</option>
        <option value="3">Q3</option>
        <option value="4">Q4</option>
      </select>
      {errors.quarter && <p className="text-red-500 mt-1">{errors.quarter.message}</p>}
    </div>
    
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2">Subject</label>
      <select 
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('subject', { required: 'Subject is required' })}
      >
        <option value="">Select Subject</option>
        {subjects.map((subject) => (
          <option key={subject} value={subject}>{subject}</option>
        ))}
      </select>
      {errors.subject && <p className="text-red-500 mt-1">{errors.subject.message}</p>}
    </div>
    
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2">Topic</label>
      <input 
        type="text" 
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        placeholder="E.g., Polynomials, French Revolution"
        {...register('topic', { required: 'Topic is required' })}
      />
      {errors.topic && <p className="text-red-500 mt-1">{errors.topic.message}</p>}
    </div>
  </div>
);

const Step2Form = ({ register, errors, formData, setFileData }) => {
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  
  // Handle file drop with react-dropzone
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    console.log("[Frontend] File selected:", file?.name);
    setFileError('');
    setFileName(file.name);
    setFileData(file);
    
    // Create a preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
  }, [setFileData]);
  
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    multiple: false,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-invalid-type') {
        setFileError('Invalid file type. Only PDF, JPG, and PNG files are allowed.');
      } else if (error?.code === 'too-many-files') {
        setFileError('Only one file can be uploaded at a time.');
      } else {
        setFileError('There was an error with the uploaded file.');
      }
    }
  });
  
  // Determine the file type icon
  const getFileIcon = () => {
    if (!fileName) return <FaCloudUploadAlt className="text-primary dark:text-primary-light text-4xl mb-2" />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') {
      return <FaFilePdf className="text-red-500 text-4xl mb-2" />;
    } else {
      return <FaImage className="text-blue-500 text-4xl mb-2" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Title</label>
        <input 
          type="text" 
          className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="E.g., Algebra Notes - Chapter 5"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-red-500 mt-1">{errors.title.message}</p>}
      </div>
      
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea 
          className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-24"
          placeholder="A brief description of your notes"
          {...register('description')}
        />
      </div>
      
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-light'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            {getFileIcon()}
            
            {isDragActive ? (
              <p className="text-primary dark:text-primary-light">Drop the file here...</p>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {fileName 
                    ? `Selected: ${fileName}` 
                    : "Drag and drop your file here, or click to browse"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supported formats: PDF, JPG, PNG
                </p>
              </>
            )}
          </div>
        </div>
        {fileError && <p className="text-red-500 mt-1">{fileError}</p>}
        
        {previewUrl && (
          <div className="mt-4 border rounded-lg overflow-hidden dark:border-gray-600">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-64 mx-auto object-contain" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

const Step3Review = ({ formData, fileData }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Review Your Submission</h3>
    
    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Grade</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">Grade {formData.grade}</p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Semester</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">{formData.semester === '1' ? '1st' : '2nd'} Semester</p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Quarter</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">Q{formData.quarter}</p>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Subject</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">{formData.subject}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Topic</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">{formData.topic}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Title</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">{formData.title}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Description</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">{formData.description || "No description provided"}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">File</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">{fileData ? fileData.name : "No file selected"}</p>
      </div>
    </div>
  </div>
);

const SuccessModal = ({ isOpen, onClose, quote }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <FaCheckCircle className="text-green-500 dark:text-green-400 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Upload Successful!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {quote}
            </p>
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const NoteUploader = () => {
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { recordActivity } = useStreak();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const formData = watch();
  
  // List of subjects
  const subjects = [
    "Mathematics", 
    "Physics", 
    "Chemistry", 
    "Biology", 
    "History", 
    "Geography", 
    "English", 
    "Literature", 
    "Computer Science",
    "Economics",
    "Business Studies"
  ];
  
  // Motivational quotes for success modal
  const quotes = [
    "Knowledge is power. Keep sharing!",
    "Your contribution today will help someone succeed tomorrow.",
    "Great job! Your shared notes will make a difference.",
    "The more we share, the more we have. Thank you for your contribution!",
    "Sharing knowledge is a way to achieve immortality."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  const nextStep = () => {
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const handleUpload = async () => {
    if (!fileData) {
      alert("Please select a file first!");
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      debug("[Frontend] Starting upload process...");
      toast.success('Starting upload process...', { id: 'upload-toast' });
      
      // Use the API client to handle the upload flow
      await uploadNote(fileData, formData);
      
      // Record activity for XP
      recordActivity('UPLOAD_NOTE');
      
      toast.success('Note uploaded successfully!', { id: 'upload-toast' });
      alert("✅ Note successfully uploaded!");
      setShowSuccess(true);
    } catch (err) {
      debug("[Frontend] Upload failed: " + err.message);
      setError("Upload failed: " + err.message);
      toast.error('Upload failed: ' + err.message, { id: 'upload-toast' });
      alert(`❌ Error uploading note: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Upload Notes</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Share your knowledge and help others succeed in their academic journey.
        </p>
      </div>
      
      {/* Progress steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div
              className={`rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center border-2 ${
                step >= i
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
              }`}
            >
              {i}
            </div>
            {i < 3 && (
              <div
                className={`flex-1 h-1 mx-1 sm:mx-2 ${
                  step > i ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6"
      >
        <form>
          {step === 1 && (
            <Step1Form 
              register={register} 
              errors={errors} 
              subjects={subjects} 
            />
          )}
          
          {step === 2 && (
            <Step2Form 
              register={register} 
              errors={errors} 
              formData={formData} 
              setFileData={setFileData} 
            />
          )}
          
          {step === 3 && (
            <Step3Review 
              formData={formData} 
              fileData={fileData} 
            />
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center">
              <FaTimesCircle className="mr-2" />
              {error}
            </div>
          )}
          
          <div className="mt-6 flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0">
            {step > 1 && (
              <button
                type="button"
                className="btn bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                onClick={prevStep}
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
            )}
            
            <div className={`${step > 1 ? 'sm:ml-auto' : 'ml-auto'}`}>
              {step < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary flex items-center justify-center w-full sm:w-auto"
                  onClick={() => handleSubmit(nextStep)()}
                >
                  Next <FaArrowRight className="ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn btn-primary flex items-center justify-center w-full sm:w-auto ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
      
      <SuccessModal 
        isOpen={showSuccess} 
        onClose={() => setShowSuccess(false)} 
        quote={randomQuote}
      />
    </div>
  );
};

export default NoteUploader; 