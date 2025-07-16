import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReviewForm from './ReviewForm';

interface Meal {
  id: number;
  date: string;
  menu: string;
  imageUrl?: string;
}

interface Review {
  id: number;
  meal_id: number;
  rating: number;
  comment: string;
}

const pollOptions: { [key: number]: string } = {
  5: 'อร่อยมาก',
  4: 'ดี',
  3: 'พอกิน',
  2: 'เฉยๆ',
  1: 'แย่',
};

interface MealDisplayProps {
  refreshTrigger: number;
}

const MealDisplay: React.FC<MealDisplayProps> = ({ refreshTrigger }) => {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchTodaysMeal = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await axios.get(`http://localhost:3001/api/meals/${today}`);
      setMeal(response.data);
    } catch (err) {
      setError('ไม่พบเมนูอาหารสำหรับวันนี้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewsForMeal = async (mealId: number) => {
    try {
      const response = await axios.get<Review[]>(`http://localhost:3001/api/reviews/${mealId}`);
      setReviews(response.data);
    } catch (err) {
      console.error(`ไม่สามารถดึงรีวิวสำหรับเมนู ${mealId} ได้:`, err);
    }
  };

  useEffect(() => {
    fetchTodaysMeal();
  }, [refreshTrigger]);

  useEffect(() => {
    if (meal) {
      fetchReviewsForMeal(meal.id);
    }
  }, [meal, refreshTrigger]);

  const getPollResults = () => {
    const results: { [key: string]: number } = {};
    Object.values(pollOptions).forEach(label => results[label] = 0);
    reviews.forEach(review => {
      const label = pollOptions[review.rating];
      if (label) {
        results[label]++;
      }
    });
    return results;
  };

  if (loading) return <p className="text-center text-xl text-gray-600 py-8">กำลังโหลดเมนูอาหาร...</p>;
  if (error) return <p className="text-center text-xl text-red-500 py-8">ข้อผิดพลาด: {error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-8 text-center tracking-tight">Today's Menu</h2>
      {!meal ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg shadow-inner">
          <p className="text-2xl text-gray-600 font-medium">No menu available for today.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform transition-transform duration-500 hover:scale-105 hover:shadow-3xl">
          {meal.imageUrl && (
            <div className="w-full h-64 sm:h-80 lg:h-96 overflow-hidden bg-gray-100 flex items-center justify-center">
              <img className="w-full h-full object-cover object-center" src={meal.imageUrl} alt={meal.menu} />
            </div>
          )}
          <div className="p-6 sm:p-8 lg:p-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 text-center leading-tight">{meal.menu}</h3>
            <p className="text-gray-500 text-md sm:text-lg mb-8 text-center">Date: {meal.date}</p>
            
            <div className="mb-8 p-6 sm:p-8 bg-blue-50 rounded-xl shadow-inner border border-blue-100">
              <h4 className="text-2xl sm:text-3xl font-semibold text-blue-800 mb-6 text-center">Latest Poll Results</h4>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(getPollResults()).map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between text-lg sm:text-xl py-2 px-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <span className="text-gray-700 font-medium">{label}</span>
                      <span className="font-bold text-blue-600">{count} votes</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-lg sm:text-xl text-center py-4">No votes yet. Be the first to review!</p>
              )}
            </div>

            <ReviewForm mealId={meal.id} onReviewSubmitted={() => fetchReviewsForMeal(meal.id)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MealDisplay;


