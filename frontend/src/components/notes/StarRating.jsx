import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak';

const StarRating = ({ noteId, initialRating = 0, size = 'medium', readOnly = false, onRatingChange }) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const { recordActivity } = useStreak();
  
  // Get star size based on the size prop
  const getStarSize = () => {
    switch(size) {
      case 'small':
        return 16;
      case 'large':
        return 28;
      case 'medium':
      default:
        return 22;
    }
  };
  
  // Load rating from localStorage on component mount
  useEffect(() => {
    if (noteId) {
      const storedRating = localStorage.getItem(`note_rating_${noteId}`);
      if (storedRating) {
        setRating(parseFloat(storedRating));
        setHasRated(true);
      }
    }
  }, [noteId]);
  
  // Handle star click
  const handleRatingClick = (selectedRating) => {
    if (readOnly) return;
    
    // Save to localStorage
    if (noteId) {
      localStorage.setItem(`note_rating_${noteId}`, selectedRating.toString());
    }
    
    setRating(selectedRating);
    setHasRated(true);
    
    // Record activity for XP
    recordActivity('RATE_NOTE');
    
    // Call the callback if provided
    if (onRatingChange) {
      onRatingChange(selectedRating);
    }
  };
  
  // Generate star components based on rating
  const renderStars = () => {
    const starSize = getStarSize();
    const stars = [];
    
    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
      if (readOnly) {
        // Read-only stars (can show half stars)
        if (i <= rating) {
          // Full star
          stars.push(
            <FaStar 
              key={i} 
              className="text-yellow-400" 
              size={starSize} 
            />
          );
        } else if (i - 0.5 <= rating) {
          // Half star
          stars.push(
            <FaStarHalfAlt 
              key={i} 
              className="text-yellow-400" 
              size={starSize} 
            />
          );
        } else {
          // Empty star
          stars.push(
            <FaRegStar 
              key={i} 
              className="text-gray-400 dark:text-gray-600" 
              size={starSize} 
            />
          );
        }
      } else {
        // Interactive stars
        stars.push(
          <span
            key={i}
            className="cursor-pointer"
            onClick={() => handleRatingClick(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${i} out of 5 stars`}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleRatingClick(i);
              }
            }}
          >
            {i <= (hover || rating) ? (
              <FaStar 
                className="text-yellow-400" 
                size={starSize} 
              />
            ) : (
              <FaRegStar 
                className="text-gray-400 dark:text-gray-600" 
                size={starSize} 
              />
            )}
          </span>
        );
      }
    }
    
    return stars;
  };
  
  return (
    <div className="flex items-center">
      <div className="flex" role="radiogroup" aria-label="Note rating">
        {renderStars()}
      </div>
      
      {hasRated && !readOnly && (
        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
          Rating saved!
        </span>
      )}
      
      {readOnly && rating > 0 && (
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating; 