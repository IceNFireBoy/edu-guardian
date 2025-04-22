import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FaArrowRight, FaArrowLeft, FaCloudUploadAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import cloudinaryService from '../../utils/cloudinaryService';
import { useStreak } from '../../hooks/useStreak';

// Form step components
const Step1Form = ({ register, errors, subjects }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-gray-700 dark:text-gray-300 mb-2">Grade Level</label>
      <select 
        className="input"
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
        className="input"
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
        className="input"
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
        className="input"
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
        className="input"
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
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Title</label>
        <input 
          type="text" 
          className="input"
          placeholder="E.g., Algebra Notes - Chapter 5"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-red-500 mt-1">{errors.title.message}</p>}
      </div>
      
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea 
          className="input min-h-24"
          placeholder="A brief description of your notes"
          {...register('description')}
        />
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input 
          type="file" 
          id="file" 
          accept=".pdf,.jpg,.jpeg,.png" 
          className="hidden"
          onChange={handleFileChange}
          required
        />
        <label htmlFor="file" className="cursor-pointer">
          <div className="flex flex-col items-center">
            <FaCloudUploadAlt className="text-primary text-4xl mb-2" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {fileName ? fileName : "Click to upload PDF or image file"}
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, JPG, PNG
            </p>
          </div>
        </label>
        
        {previewUrl && (
          <div className="mt-4 border rounded-lg overflow-hidden">
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
    <h3 className="text-lg font-semibold mb-4">Review Your Submission</h3>
    
    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
      <div>
        <p className="text-gray-500 text-sm">Grade</p>
        <p className="font-medium">Grade {formData.grade}</p>
      </div>
      <div>
        <p className="text-gray-500 text-sm">Semester</p>
        <p className="font-medium">{formData.semester === '1' ? '1st' : '2nd'} Semester</p>
      </div>
      <div>
        <p className="text-gray-500 text-sm">Quarter</p>
        <p className="font-medium">Q{formData.quarter}</p>
      </div>
      <div>
        <p className="text-gray-500 text-sm">Subject</p>
        <p className="font-medium">{formData.subject}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 text-sm">Topic</p>
        <p className="font-medium">{formData.topic}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 text-sm">Title</p>
        <p className="font-medium">{formData.title}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 text-sm">Description</p>
        <p className="font-medium">{formData.description || "No description provided"}</p>
      </div>
      <div className="col-span-2">
        <p className="text-gray-500 text-sm">File</p>
        <p className="font-medium">{fileData ? fileData.name : "No file selected"}</p>
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
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Upload Successful!</h3>
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
  
  const onSubmit = async () => {
    if (!fileData) {
      setError("Please select a file to upload");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Upload the file to Cloudinary
      await cloudinaryService.uploadNote(fileData, formData);
      
      // Record activity for XP
      recordActivity('UPLOAD_NOTE');
      
      // Show success modal
      setShowSuccess(true);
      
      // Reset form
      // resetForm();
    } catch (err) {
      setError("Upload failed: " + (err.message || "Unknown error"));
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Donate Your Notes</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Share your knowledge and help others succeed in their academic journey.
        </p>
      </div>
      
      {/* Progress steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div
              className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${
                step >= i
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {i}
            </div>
            {i < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > i ? "bg-primary" : "bg-gray-300"
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
        className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6"
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
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
              <FaTimesCircle className="mr-2" />
              {error}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            {step > 1 && (
              <button
                type="button"
                className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center"
                onClick={prevStep}
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary flex items-center"
                  onClick={() => handleSubmit(nextStep)()}
                >
                  Next <FaArrowRight className="ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  className={`btn btn-primary flex items-center ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  onClick={handleSubmit(onSubmit)}
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