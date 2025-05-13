import React, { useState, useEffect, FC } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { useStreak } from '../../hooks/useStreak'; // Assuming useStreak.ts exists or will be created

// Define prop types
interface StarRatingProps {
  noteId?: string; // Optional if rating is not stored against a specific note ID sometimes
  initialRating?: number;
  size?: 'small' | 'medium' | 'large';
  readOnly?: boolean;
  onRatingChange?: (rating: number) => void;
}

// Assuming a basic type for useStreak if it's not yet converted
// interface UseStreakReturn {
//   recordActivity: (activityType: string, details?: any) => void;
//   // ... other potential fields from useStreak
// }

const StarRating: FC<StarRatingProps> = ({
  noteId,
  initialRating = 0,
  size = 'medium',
  readOnly = false,
  onRatingChange,
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hover, setHover] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const { recordActivity } = useStreak(); // Destructure with assumed type
  
  const getStarSize = (): number => {
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
  
  useEffect(() => {
    if (noteId) {
      try {
        const storedRating = localStorage.getItem(`note_rating_${noteId}`);
        if (storedRating) {
          setRating(parseFloat(storedRating));
          setHasRated(true);
        }
      } catch (err) {
        console.error('Error loading rating from localStorage:', err);
      }
    }
  }, [noteId]);
  
  const handleRatingClick = (selectedRating: number) => {
    if (readOnly) return;
    
    try {
      if (noteId) {
        localStorage.setItem(`note_rating_${noteId}`, selectedRating.toString());
        
        const ratingsData = localStorage.getItem('note_ratings') || '{}';
        const ratings = JSON.parse(ratingsData);
        ratings[noteId] = selectedRating; // This seems to override rather than store an array of ratings, which was mentioned elsewhere
        localStorage.setItem('note_ratings', JSON.stringify(ratings));
      }
      
      setRating(selectedRating);
      setHasRated(true);
      
      if (recordActivity) {
        recordActivity('RATE_NOTE');
      }
      
      if (onRatingChange) {
        onRatingChange(selectedRating);
      }
    } catch (err) {
      console.error('Error saving rating:', err);
    }
  };
  
  const renderStars = () => {
    const starSizeVal = getStarSize(); // Renamed to avoid conflict with prop name
    const stars: JSX.Element[] = [];
    
    for (let i = 1; i <= 5; i++) {
      if (readOnly) {
        if (i <= rating) {
          stars.push(
            <FaStar 
              key={i} 
              className="text-yellow-400" 
              size={starSizeVal} 
            />
          );
        } else if (i - 0.5 <= rating) {
          stars.push(
            <FaStarHalfAlt 
              key={i} 
              className="text-yellow-400" 
              size={starSizeVal} 
            />
          );
        } else {
          stars.push(
            <FaRegStar 
              key={i} 
              className="text-gray-400 dark:text-gray-600" 
              size={starSizeVal} 
            />
          );
        }
      } else {
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
            onKeyPress={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleRatingClick(i);
              }
            }}
          >
            {i <= (hover || rating) ? (
              <FaStar 
                className="text-yellow-400" 
                size={starSizeVal} 
              />
            ) : (
              <FaRegStar 
                className="text-gray-400 dark:text-gray-600" 
                size={starSizeVal} 
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