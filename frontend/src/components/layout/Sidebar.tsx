import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaBook, FaUpload, FaChartLine, FaCog, FaBars, FaTimes, 
  FaAward, FaInfoCircle, FaLightbulb, FaPlusSquare, FaLayerGroup,
  FaChevronDown, FaChevronUp, FaAngleDoubleLeft, FaAngleDoubleRight,
  FaUniversity, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus
} from 'react-icons/fa';
import { useAuthContext } from '../../features/auth/AuthContext';

// Define types for menu items
interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  requiresAuth?: boolean;
  roles?: string[];
}

// Type for the open sections state
interface OpenSections {
  navigation: boolean;
  metadata: boolean;
  studyTools: boolean;
  flashcards: boolean;
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  note?: any; // TODO: Replace with proper Note type
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, className, note }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthContext();

  // State for mobile status
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  // isOpen controls overall sidebar visibility/expanded state
  const [isOpenState, setIsOpen] = useState<boolean>(!isMobile); 

  // openSections controls individual collapsible sections within the sidebar
  const [openSections, setOpenSections] = useState<OpenSections>({
    navigation: !isMobile, // Navigation open by default on desktop if sidebar is open
    metadata: true,
    studyTools: true,
    flashcards: true,
  });

  // Effect for handling window resize
  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;

    // Set initial state based on current window size
    const initialMobile = checkMobile();
    setIsMobile(initialMobile);
    const initialIsOpen = !initialMobile;
    setIsOpen(initialIsOpen);
    setOpenSections({
      navigation: initialIsOpen, // If sidebar is open, navigation is open
      metadata: true,
      studyTools: true,
      flashcards: true,
    });

    const handleResize = () => {
      const currentMobile = checkMobile();
      setIsMobile(prevMobile => { 
        if (currentMobile !== prevMobile) { // If breakpoint crossed
          setIsOpen(!currentMobile); // Open on desktop, close on mobile
          setOpenSections(prevSections => ({
            ...prevSections,
            navigation: !currentMobile, // Auto-open/close navigation based on new mode
            // Reset other sections or maintain based on preference for breakpoint cross
            metadata: true, 
            studyTools: true,
            flashcards: true,
          }));
        }
        return currentMobile;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array: runs once on mount to set initial state & listeners
  
  const onNoteViewPage = /^\/view-note(\/|$)/.test(location.pathname);

  // Define menu items with conditional visibility based on auth status
  const menuItems: MenuItem[] = [
    { path: '/', icon: <FaHome size={20} />, label: 'Dashboard' },
    { path: '/profile', icon: <FaUser size={20} />, label: 'Profile', requiresAuth: true },
    { path: '/my-notes', icon: <FaBook size={20} />, label: 'My Notes', requiresAuth: true },
    { path: '/notes/upload', icon: <FaUpload size={20} />, label: 'Upload Notes', requiresAuth: true },
    { path: '/badges', icon: <FaAward size={20} />, label: 'Badges', requiresAuth: true },
    { path: '/progress', icon: <FaChartLine size={20} />, label: 'Progress', requiresAuth: true },
    { path: '/settings', icon: <FaCog size={20} />, label: 'Settings', requiresAuth: true }
  ];

  // Authentication related menu items
  const authItems: MenuItem[] = isAuthenticated 
    ? [{ path: '#', icon: <FaSignOutAlt size={20} />, label: 'Logout' }]
    : [
        { path: '/login', icon: <FaSignInAlt size={20} />, label: 'Login' },
        { path: '/register', icon: <FaUserPlus size={20} />, label: 'Register' }
      ];
  
  const toggleSidebar = useCallback(() => {
    setIsOpen(prevIsOpen => {
      const nextIsOpen = !prevIsOpen;
      // If collapsing on desktop, also collapse all internal sections
      if (!nextIsOpen && !isMobile) {
        setOpenSections({
          navigation: false, metadata: false, studyTools: false, flashcards: false,
        });
      }
      // If expanding on desktop, restore sensible defaults for internal sections
      else if (nextIsOpen && !isMobile) {
        setOpenSections({
          navigation: true, metadata: true, studyTools: true, flashcards: true,
        });
      }
      return nextIsOpen;
    });
  }, [isMobile]); // isMobile is a dependency for toggleSidebar's logic

  const toggleSection = (section: keyof OpenSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const actionButtonClasses = "w-full flex items-center space-x-3 p-3 rounded-md transition-colors text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700";
  const disabledButtonClasses = "w-full flex items-center space-x-3 p-3 rounded-md text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed";

  const handleAuthAction = (path: string, label: string) => {
    if (label === 'Logout') {
      logout();
      navigate('/');
      toggleSidebar(); // Close sidebar on mobile
    } else {
      navigate(path);
      if (isMobile) toggleSidebar(); // Close sidebar on mobile
    }
  };

  const currentSidebarWidthClass = isMobile ? (isOpenState ? 'w-72' : 'w-0') : (isOpenState ? 'w-64' : 'w-20');
  const currentSidebarActualWidth = isMobile ? (isOpenState ? 288 : 0) : (isOpenState ? 256 : 80);

  // Sidebar Header Content Logic
  let headerContent;
  if (!isMobile) { // Desktop
    if (isOpenState) {
      headerContent = (
        <>
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary dark:text-primary-light">EduGuardian</h1>
          </Link>
          <button onClick={toggleSidebar} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light p-1 rounded-md" aria-label="Close sidebar">
            <FaAngleDoubleLeft size={22} />
          </button>
        </>
      );
    } else { // Desktop Collapsed
      headerContent = (
        <button onClick={toggleSidebar} className="text-primary dark:text-primary-light p-1" aria-label="Open sidebar">
          <FaAngleDoubleRight size={22} />
        </button>
      );
    }
  } else { // Mobile (only shown when isOpen is true, as an overlay)
    if (isOpenState) {
      headerContent = (
        <>
          <Link to="/" className="flex items-center space-x-2" onClick={toggleSidebar}> {/* Also close on nav */}
            <h1 className="text-2xl font-bold text-primary dark:text-primary-light">EduGuardian</h1>
          </Link>
          <button onClick={toggleSidebar} className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light p-1 rounded-md" aria-label="Close menu">
            <FaTimes size={22} />
          </button>
        </>
      );
    }
  }

  return (
    <>
      {/* Mobile Hamburger (fixed position, always available if mobile) */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className={`fixed top-4 left-4 z-[60] p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md text-gray-800 dark:text-gray-100 ${isOpenState ? 'hidden' : ''}` } /* Hide if mobile sidebar is open (close button is inside then) */
          aria-label="Open menu"
        >
          <FaBars size={24} />
        </button>
      )}
      
      {/* Mobile overlay (dimmed background) */}
      {isMobile && isOpenState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50"
          onClick={toggleSidebar}
        />
      )}
      
      <AnimatePresence>
        {/* Render sidebar if not mobile OR if mobile and isOpen */}
        {(!isMobile || isOpenState) && (
          <motion.div
            key="sidebar"
            initial={{ x: -currentSidebarActualWidth }}
            animate={{ x: 0, width: currentSidebarActualWidth }}
            exit={{ x: -currentSidebarActualWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.2 }}
            className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-800 shadow-xl z-[55] flex flex-col border-r border-gray-200 dark:border-slate-700 ${isMobile && !isOpenState ? 'hidden' : ''}`}
            style={{ width: currentSidebarActualWidth }}
          >
            <div className={`p-4 border-b border-gray-200 dark:border-slate-700 flex items-center ${(!isMobile && isOpenState) ? 'justify-between' : 'justify-center'}`}>
              {headerContent}
            </div>

            {/* Main Scrollable Content - only if sidebar is fully open OR if on mobile (where it's an overlay) */}
            {(isOpenState || (isMobile && isOpenState)) && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-gray-50 dark:bg-slate-750 rounded-lg shadow">
                  <button
                    onClick={() => toggleSection('navigation')}
                    className="w-full flex items-center justify-between p-3 text-left font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <FaLayerGroup className="text-primary dark:text-primary-light" />
                      <span>Navigation</span>
                    </div>
                    {openSections.navigation ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                  </button>
                  <AnimatePresence>
                    {openSections.navigation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden p-3 border-t border-gray-200 dark:border-slate-600"
                      >
                        <ul className="space-y-1.5">
                          {/* Show regular navigation items with auth requirements */}
                          {menuItems.map((item) => {
                            if (item.requiresAuth && !isAuthenticated) {
                              return null; // Hide auth-required items when not logged in
                            }
                            return (
                              <li key={item.path}>
                                <Link
                                  to={item.path}
                                  className={`flex items-center p-2.5 rounded-md transition-colors text-sm font-medium ${
                                    location.pathname === item.path
                                      ? 'bg-primary/10 text-primary dark:text-primary-light dark:bg-primary/20'
                                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                                  }`}
                                  onClick={isMobile ? toggleSidebar : undefined}
                                >
                                  <span className="mr-3 text-lg">{item.icon}</span>
                                  <span>{item.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                          
                          {/* Auth section (login/logout) */}
                          <li className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                            {authItems.map((item) => (
                              <button
                                key={item.path}
                                onClick={() => handleAuthAction(item.path, item.label)}
                                className="w-full flex items-center p-2.5 rounded-md transition-colors text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600"
                              >
                                <span className="mr-3 text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Only show these sections when viewing a note */}
                {isAuthenticated && onNoteViewPage && note && (
                  <>
                    {/* Metadata Section */}
                    <div className="bg-gray-50 dark:bg-slate-750 rounded-lg shadow">
                      <button
                        onClick={() => toggleSection('metadata')}
                        className="w-full flex items-center justify-between p-3 text-left font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <FaInfoCircle className="text-blue-500" />
                          <span>Document Info</span>
                        </div>
                        {openSections.metadata ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                      </button>
                      <AnimatePresence>
                        {openSections.metadata && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden p-4 border-t border-gray-200 dark:border-slate-600"
                          >
                            <div className="space-y-2 text-sm">
                              <p className="font-medium text-gray-700 dark:text-gray-200">Title:</p>
                              <p className="text-gray-600 dark:text-gray-300">{note?.title || 'Untitled Document'}</p>
                              
                              <p className="font-medium text-gray-700 dark:text-gray-200 mt-3">Subject:</p>
                              <p className="text-gray-600 dark:text-gray-300">{note?.subject || 'Not specified'}</p>
                              
                              <p className="font-medium text-gray-700 dark:text-gray-200 mt-3">Created:</p>
                              <p className="text-gray-600 dark:text-gray-300">
                                {note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}
                              </p>
                              
                              <p className="font-medium text-gray-700 dark:text-gray-200 mt-3">Pages:</p>
                              <p className="text-gray-600 dark:text-gray-300">{note?.pageCount || 'Unknown'}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Study Tools Section */}
                    <div className="bg-gray-50 dark:bg-slate-750 rounded-lg shadow">
                      <button
                        onClick={() => toggleSection('studyTools')}
                        className="w-full flex items-center justify-between p-3 text-left font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <FaLightbulb className="text-yellow-500" />
                          <span>Study Tools</span>
                        </div>
                        {openSections.studyTools ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                      </button>
                      <AnimatePresence>
                        {openSections.studyTools && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden p-3 space-y-2 border-t border-gray-200 dark:border-slate-600"
                          >
                            <button
                              onClick={() => navigate(`/study/${note.id}`)}
                              className={actionButtonClasses}
                            >
                              <FaBook size={16} className="text-blue-500" />
                              <span>Study Mode</span>
                            </button>

                            <button
                              onClick={() => {
                                /* Implementation for Generate Summary */
                              }}
                              className={user && (user.summaryQuota ?? 0) > 0 ? actionButtonClasses : disabledButtonClasses}
                              disabled={!user || (user.summaryQuota ?? 0) <= 0}
                            >
                              <FaUniversity size={16} className="text-green-500" />
                              <div className="flex flex-col items-start">
                                <span>Generate Summary</span>
                                {user && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {(user.summaryQuota ?? 0) > 0 ? `${user.summaryQuota} uses left` : 'No quota left'}
                                  </span>
                                )}
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Flashcards Section */}
                    <div className="bg-gray-50 dark:bg-slate-750 rounded-lg shadow">
                      <button
                        onClick={() => toggleSection('flashcards')}
                        className="w-full flex items-center justify-between p-3 text-left font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <FaLayerGroup className="text-purple-500" />
                          <span>Flashcards</span>
                        </div>
                        {openSections.flashcards ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                      </button>
                      <AnimatePresence>
                        {openSections.flashcards && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden p-3 space-y-2 border-t border-gray-200 dark:border-slate-600"
                          >
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Create and manage flashcards for this document.
                            </p>
                            
                            <button
                              onClick={() => {
                                /* Implementation for Add Flashcard */
                              }}
                              className={user && (user.flashcardQuota ?? 0) > 0 ? actionButtonClasses : disabledButtonClasses}
                              disabled={!user || (user.flashcardQuota ?? 0) <= 0}
                            >
                              <FaPlusSquare size={16} className="text-indigo-500" />
                              <div className="flex flex-col items-start">
                                <span>Add Flashcard</span>
                                {user && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {(user.flashcardQuota ?? 0) > 0 ? `${user.flashcardQuota} uses left` : 'No quota left'}
                                  </span>
                                )}
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Collapsed view (for desktop only) */}
            {!isOpenState && !isMobile && (
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                <ul className="space-y-2">
                  {menuItems.map((item) => {
                    if (item.requiresAuth && !isAuthenticated) {
                      return null; // Hide auth-required items when not logged in
                    }
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          title={item.label}
                          className={`flex justify-center items-center p-3 rounded-md transition-colors ${
                            location.pathname === item.path
                              ? 'bg-primary/10 text-primary dark:text-primary-light dark:bg-primary/20'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                          }`}
                        >
                          {item.icon}
                        </Link>
                      </li>
                    );
                  })}
                  
                  {/* Auth section (login/logout) */}
                  <li className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                    {authItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleAuthAction(item.path, item.label)}
                        title={item.label}
                        className="w-full flex justify-center items-center p-3 rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600"
                      >
                        {item.icon}
                      </button>
                    ))}
                  </li>
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar; 