import React, { useState } from 'react';
import axios from 'axios';

interface ReviewFormProps {
  mealId: number;
  onReviewSubmitted: () => void;
  userId: string | null;
}

const pollOptions = [
  { label: 'อร่อยมาก', value: 5, color: 'bg-green-600 hover:bg-green-700' },
  { label: 'ดี', value: 4, color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'พอกิน', value: 3, color: 'bg-yellow-600 hover:bg-yellow-700' },
  { label: 'เฉยๆ', value: 2, color: 'bg-orange-600 hover:bg-orange-700' },
  { label: 'แย่', value: 1, color: 'bg-red-600 hover:bg-red-700' },
];

const ReviewForm: React.FC<ReviewFormProps> = ({ mealId, onReviewSubmitted, userId }) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false); // State to control form visibility

  const handlePollSubmit = async (ratingValue: number) => {
    if (!userId) {
      setError('กรุณาเข้าสู่ระบบเพื่อรีวิว');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post('http://localhost:3001/api/reviews', {
        meal_id: mealId,
        rating: ratingValue,
        comment: '', // Not used in poll-style reviews
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSuccess('ขอบคุณสำหรับความคิดเห็น!');
      onReviewSubmitted();
      setShowForm(false); // Hide form after successful submission
    } catch (err) {
      setError('ไม่สามารถส่งความคิดเห็นได้');
      console.error(err);
    } finally {
      setTimeout(() => setSubmitting(false), 500); // Prevent rapid clicking
    }
  };

  return (
    <div className="mt-10 p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Review This Meal
        </button>
      ) : (
        <div className="space-y-6">
          <h4 className="text-2xl sm:text-3xl font-extrabold mb-4 text-center text-gray-800">Rate This Meal</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
            {pollOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePollSubmit(option.value)}
                className={`text-white font-bold py-3 px-2 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${option.color} ${option.color.replace('bg-', 'focus:ring-')}`}
                disabled={submitting}
              >
                {option.label}
              </button>
            ))}
          </div>
          {error && <p className="text-red-500 mt-6 text-center text-base">{error}</p>}
          {success && <p className="text-green-500 mt-6 text-center text-base">{success}</p>}
          <button 
            onClick={() => setShowForm(false)}
            className="w-full mt-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewForm;
