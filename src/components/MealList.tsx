import React, { useEffect, useState } from 'react';
import axios from 'axios';

// --- Interfaces for data structures ---
interface Meal {
  id: number;
  date: string; // Consider using Date object if date manipulation is needed
  menu: string;
  imageUrl?: string; // Optional image URL
}

interface Review {
  id: number;
  meal_id: number;
  rating: number; // e.g., 1 to 5
  // Add comment: string; if reviews also have text comments
}

// --- Poll options mapping for display ---
const pollOptions: { [key: number]: string } = {
  5: 'อร่อยมาก',
  4: 'ดี',
  3: 'พอกิน',
  2: 'เฉยๆ',
  1: 'แย่',
};

// --- Props for the MealList component ---
interface MealListProps {
  refreshTrigger: number; // A prop to trigger data refetch from parent
  onMealDeleted: () => void; // Callback to notify parent a meal was deleted
}

const MealList: React.FC<MealListProps> = ({ refreshTrigger, onMealDeleted }) => {
  // --- State management ---
  const [meals, setMeals] = useState<Meal[]>([]);
  // Store reviews mapped by meal ID for efficient lookup
  const [reviews, setReviews] = useState<{[key: number]: Review[]}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data fetching function ---
  const fetchMealsAndReviews = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Fetch meals
      const mealsResponse = await axios.get<Meal[]>('http://localhost:3001/api/meals');
      const mealsData = mealsResponse.data;
      setMeals(mealsData);

      // Fetch reviews for each meal
      const fetchedReviews: {[key: number]: Review[]} = {};
      for (const meal of mealsData) {
        try {
          const reviewsResponse = await axios.get<Review[]>(`http://localhost:3001/api/reviews/${meal.id}`);
          fetchedReviews[meal.id] = reviewsResponse.data;
        } catch (reviewErr) {
          console.warn(`Could not fetch reviews for meal ID ${meal.id}:`, reviewErr);
          // Optionally, handle specific review fetch errors or set a default empty array
          fetchedReviews[meal.id] = [];
        }
      }
      setReviews(fetchedReviews);

    } catch (err) {
      // Catch errors during meal fetching
      setError('ไม่สามารถดึงข้อมูลเมนูได้');
      console.error('Error fetching meals or reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Effect hook to fetch data on component mount or refreshTrigger change ---
  useEffect(() => {
    fetchMealsAndReviews();
  }, [refreshTrigger]); // Dependency array: re-run when refreshTrigger changes

  // --- Handle meal deletion ---
  const handleDelete = async (mealId: number) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      try {
        await axios.delete(`http://localhost:3001/api/meals/${mealId}`);
        onMealDeleted(); // Notify parent to trigger a re-fetch or update state
        // Optionally, remove the meal from the local state immediately for faster UI update
        setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
      } catch (err) {
        alert('ไม่สามารถลบเมนูได้');
        console.error('Error deleting meal:', err);
      }
    }
  };

  // --- Calculate poll results for a given meal ---
  const getPollResults = (mealId: number) => {
    const mealReviews = reviews[mealId] || []; // Get reviews for the specific meal
    const results: { [key: string]: number } = {};

    // Initialize all poll options with 0 counts
    Object.values(pollOptions).forEach(label => results[label] = 0);

    // Sum up the counts for each rating
    mealReviews.forEach(review => {
      const label = pollOptions[review.rating];
      if (label) {
        results[label]++;
      }
    });
    return results;
  };

  // --- Render loading and error states ---
  if (loading) {
    return <p className="text-center text-xl text-gray-600 py-8">กำลังโหลดรายการอาหาร...</p>;
  }

  if (error) {
    return <p className="text-center text-xl text-red-500 py-8">ข้อผิดพลาด: {error}</p>;
  }

  // --- Main component rendering ---
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center">All Meals</h2>
      <div className="space-y-8">
        {meals.length === 0 ? (
          <p className="text-gray-500 text-lg text-center py-4">No meals have been added yet.</p>
        ) : (
          meals.map((meal) => {
            const pollResults = getPollResults(meal.id);
            return (
              <div
                key={meal.id}
                className="bg-gray-50 p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center gap-6 transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-lg border border-gray-100"
              >
                {meal.imageUrl && (
                  <img
                    src={meal.imageUrl}
                    alt={meal.menu}
                    className="w-full md:w-64 h-48 object-cover rounded-lg shadow-sm"
                  />
                )}
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{meal.menu}</h3>
                  <p className="text-md text-gray-600 mb-4">Date: {meal.date}</p>
                  <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-3">Review Results:</h4>
                    <ul className="space-y-2">
                      {Object.entries(pollResults).map(([label, count]) => (
                        <li key={label} className="flex justify-between items-center text-gray-600 text-sm">
                          <span>{label}:</span>
                          <span className="font-bold text-blue-600">{count} votes</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-4 md:mt-0">
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MealList;