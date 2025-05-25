import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, SubmitHandler, FieldErrors } from 'react-hook-form';
import { FaArrowRight, FaArrowLeft, FaCloudUploadAlt, FaCheckCircle, FaTimesCircle, FaFilePdf, FaImage, FaExclamationTriangle } from 'react-icons/fa';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useStreak } from '../../hooks/useStreak';
import { toast } from 'react-hot-toast';
import { useNote } from './useNote'; 
import { Note, NoteUploadData } from './noteTypes';
import {
  subjectsArray,
  gradeLevels,
  semesters,
  quarters,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
  FILE_TYPE_EXTENSIONS
} from '../../config/constants'; // Import from new config file

interface FormValues extends Omit<NoteUploadData, 'file' | 'tags'> {
  tags?: string; // Tags will be a comma-separated string in the form
}

interface Step1FormProps {
  register: any; 
  errors: FieldErrors<FormValues>;
}

const Step1Form: React.FC<Step1FormProps> = ({ register, errors }) => (
  <div className="space-y-4">
    <div>
      <label htmlFor="grade" className="block text-gray-700 dark:text-gray-300 mb-2">Grade Level</label>
      <select 
        id="grade"
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('grade', { required: 'Grade is required' })}
      >
        <option value="">Select Grade</option>
        {gradeLevels.map(grade => (
          <option key={grade.value} value={grade.value}>{grade.label}</option>
        ))}
      </select>
      {errors.grade && <p className="text-red-500 mt-1 text-sm">{errors.grade.message}</p>}
    </div>
    
    <div>
      <label htmlFor="semester" className="block text-gray-700 dark:text-gray-300 mb-2">Semester</label>
      <select 
        id="semester"
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('semester', { required: 'Semester is required' })}
      >
        <option value="">Select Semester</option>
        {semesters.map(semester => (
          <option key={semester.value} value={semester.value}>{semester.label}</option>
        ))}
      </select>
      {errors.semester && <p className="text-red-500 mt-1 text-sm">{errors.semester.message}</p>}
    </div>
    
    <div>
      <label htmlFor="quarter" className="block text-gray-700 dark:text-gray-300 mb-2">Quarter</label>
      <select 
        id="quarter"
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('quarter', { required: 'Quarter is required' })}
      >
        <option value="">Select Quarter</option>
        {quarters.map(quarter => (
          <option key={quarter.value} value={quarter.value}>{quarter.label}</option>
        ))}
      </select>
      {errors.quarter && <p className="text-red-500 mt-1 text-sm">{errors.quarter.message}</p>}
    </div>
    
    <div>
      <label htmlFor="subject" className="block text-gray-700 dark:text-gray-300 mb-2">Subject</label>
      <select 
        id="subject"
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        {...register('subject', { required: 'Subject is required' })}
      >
        <option value="">Select Subject</option>
        {subjectsArray.map((subject) => (
          <option key={subject} value={subject}>{subject}</option>
        ))}
      </select>
      {errors.subject && <p className="text-red-500 mt-1 text-sm">{errors.subject.message}</p>}
    </div>
    
    <div>
      <label htmlFor="topic" className="block text-gray-700 dark:text-gray-300 mb-2">Topic</label>
      <input 
        id="topic"
        type="text" 
        className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        placeholder="E.g., Polynomials, French Revolution"
        {...register('topic', { 
            required: 'Topic is required', 
            minLength: { value: 3, message: 'Topic must be at least 3 characters' },
            maxLength: { value: 100, message: 'Topic cannot exceed 100 characters' }
        })}
      />
      {errors.topic && <p className="text-red-500 mt-1 text-sm">{errors.topic.message}</p>}
    </div>
  </div>
);

interface Step2FormProps {
  register: any;
  errors: FieldErrors<FormValues>;
  setFileData: (file: File | null) => void;
  fileData: File | null; // Pass fileData to display size
}

const Step2Form: React.FC<Step2FormProps> = ({ register, errors, setFileData, fileData }) => {
  const [fileName, setFileName] = useState<string>(fileData?.name || '');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setFileError(''); // Clear previous error
    setPreviewUrl('');
    setFileName('');
    setFileData(null);

    if (fileRejections.length > 0) {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-invalid-type') {
        setFileError('Invalid file type. Allowed: PDF, JPG, PNG.');
      } else if (error?.code === 'too-many-files') {
        setFileError('Only one file can be uploaded at a time.');
      } else if (error?.code === 'file-too-large') {
        setFileError(`File is too large. Maximum size is ${MAX_UPLOAD_SIZE_MB} MB.`);
      } else {
        setFileError(error?.message || 'There was an error with the uploaded file.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      setFileData(file); // This will update fileData in the parent component
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } 
    }
  }, [setFileData]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: FILE_TYPE_EXTENSIONS,
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_UPLOAD_SIZE_BYTES,
  });
  
  const getFileIcon = () => {
    if (!fileName) return <FaCloudUploadAlt className="text-primary dark:text-primary-light text-4xl mb-2" />;
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FaFilePdf className="text-red-500 text-4xl mb-2" />;
    } else if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
      return <FaImage className="text-blue-500 text-4xl mb-2" />;
    }
    return <FaCloudUploadAlt className="text-primary dark:text-primary-light text-4xl mb-2" />;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 mb-2">Title</label>
        <input 
          id="title"
          type="text" 
          className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="E.g., Algebra Notes - Chapter 5"
          {...register('title', {
             required: 'Title is required',
             minLength: { value: 5, message: 'Title must be at least 5 characters' },
             maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
            })}
        />
        {errors.title && <p className="text-red-500 mt-1 text-sm">{errors.title.message}</p>}
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
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Tags (comma-separated)</label>
        <input 
          type="text" 
          className="w-full input bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="E.g., algebra, important, chapter5"
          {...register('tags')}
        />
      </div>

      <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            defaultChecked={true}
            {...register('isPublic')}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Make this note public
          </label>
        </div>
      
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors 
        ${isDragActive ? 'border-primary bg-primary-light/20 dark:bg-primary-dark/20' : 'border-gray-300 dark:border-slate-600 hover:border-primary-light dark:hover:border-primary-dark'}
        ${fileError ? 'border-red-500' : ''}
      `}>
        <input {...getInputProps()} />
        {getFileIcon()}
        {isDragActive ? (
          <p className="text-primary dark:text-primary-light">Drop the file here ...</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Drag & drop a PDF, JPG, or PNG file here, or click to select file.
            <br/>
            <span className="text-xs">(Max size: {MAX_UPLOAD_SIZE_MB}MB)</span>
          </p>
        )}
      </div>
      {fileError && (
        <div className="flex items-center text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            <FaExclamationTriangle className="mr-2" /> 
            <p className="text-sm">{fileError}</p>
        </div>
      )}
      {fileName && !fileError && (
        <div className="text-green-600 dark:text-green-400 mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
          <p className="text-sm font-medium flex items-center">
            <FaCheckCircle className="mr-2"/> 
            Selected: {fileName} 
            {fileData && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({(fileData.size / (1024*1024)).toFixed(2)} MB)</span>}
          </p>
        </div>
      )}
      {previewUrl && <img src={previewUrl} alt="Preview" className="mt-4 max-h-40 rounded-md shadow-sm mx-auto" />}
    </div>
  );
};

interface Step3ReviewProps {
  formData: FormValues;
  fileData: File | null;
}

const Step3Review: React.FC<Step3ReviewProps> = ({ formData, fileData }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Review Your Submission</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
      {[ 'Grade', 'Semester', 'Quarter', 'Subject', 'Topic', 'Title'].map(label => (
        <div key={label} className={label === 'Topic' || label === 'Title' ? 'sm:col-span-2' : ''}>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">
            {formData[label.toLowerCase() as keyof FormValues] || "N/A"}
          </p>
        </div>
      ))}
      <div className="sm:col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Description</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">
          {formData.description || "No description provided"}
        </p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Tags</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">
          {formData.tags || "No tags"}
        </p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Public</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">
          {formData.isPublic ? 'Yes' : 'No'}
        </p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">File</p>
        <p className="font-medium text-gray-800 dark:text-gray-100">
          {fileData ? fileData.name : "No file selected"}
        </p>
      </div>
    </div>
  </div>
);

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, quote }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose} // Close on overlay click
      >
        <motion.div 
          initial={{ scale: 0.9, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: -20 }}
          className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full text-center"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Upload Successful!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your note has been uploaded and is now ready for studying.
          </p>
          <p className="italic text-sm text-gray-500 dark:text-gray-400 mb-6">
            &ldquo;{quote}&rdquo;
          </p>
          <button 
            onClick={onClose}
            className="btn btn-primary w-full"
          >
            Awesome!
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const inspirationalQuotes = [
  "The beautiful thing about learning is that no one can take it away from you."
  // ... more quotes ...
];

const NoteUploader: React.FC = () => {
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');
  const { uploadNote, loading, error: apiError } = useNote(); 
  const { recordActivity } = useStreak();

  const { register, handleSubmit, formState: { errors }, trigger, getValues, reset } = useForm<FormValues>({
    mode: 'onChange'
  });

  const nextStep = async () => {
    const isValid = await trigger();
    if (isValid) setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleUpload: SubmitHandler<FormValues> = async (data) => {
    if (!fileData) {
      toast.error("Please select a file to upload.");
      return;
    }
    
    const completeNoteData: NoteUploadData = {
      ...data,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      file: fileData,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
    };

    const uploadedNote = await uploadNote(completeNoteData);

    if (uploadedNote) {
      setRandomQuote(inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]);
      setShowSuccessModal(true);
      recordActivity('UPLOAD_NOTE');
      toast.success('Note uploaded successfully!');
      reset(); 
      setFileData(null);
      setStep(1);
    } else {
      toast.error(apiError || 'Failed to upload note. Please try again.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Form register={register} errors={errors} />;
      case 2:
        return <Step2Form register={register} errors={errors} setFileData={setFileData} fileData={fileData} />;
      case 3:
        return <Step3Review formData={getValues()} fileData={fileData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === 1 ? 0 : (step > (getValues() ? 1: 0) ? 50 : -50) }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === 3 ? 0 : (step < (getValues() ? 3: 0) ? -50 : 50) }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        {step > 1 && (
          <button onClick={prevStep} className="btn btn-secondary">
            <FaArrowLeft className="mr-2" /> Previous
          </button>
        )}
        <div className="flex-grow"></div> {/* Spacer */}
        {step < 3 && (
          <button onClick={nextStep} className="btn btn-primary">
            Next <FaArrowRight className="ml-2" />
          </button>
        )}
        {step === 3 && (
          <button 
            onClick={handleSubmit(handleUpload)} 
            disabled={loading || !fileData}
            className="btn btn-success disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Note'} <FaCloudUploadAlt className="ml-2" />
          </button>
        )}
      </div>
      {apiError && step === 3 && <p className="text-red-500 mt-2 text-center">Upload failed: {apiError}</p>}
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} quote={randomQuote} />
    </div>
  );
};

export default NoteUploader; 