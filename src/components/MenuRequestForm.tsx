import React, { useState } from 'react';
import axios from 'axios';

interface MenuRequestFormProps {
  onMenuRequestSubmitted: () => void;
}

const MenuRequestForm: React.FC<MenuRequestFormProps> = ({ onMenuRequestSubmitted }) => {
  const [requestedMenu, setRequestedMenu] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if today is Saturday (day 6 in JavaScript, where Sunday is 0)
  const today = new Date();
  const isSaturday = today.getDay() === 6;
  const requestDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post('http://localhost:3001/api/menu-requests', {
        request_date: requestDate,
        requested_menu: requestedMenu,
      });
      setSuccess('ส่งคำขอเมนูสำเร็จ!');
      setRequestedMenu('');
      onMenuRequestSubmitted();
    } catch (err) {
      setError('ไม่สามารถส่งคำขอเมนูได้');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mt-6 border border-gray-200">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center">Request a Meal for Next Week</h2>
      {!isSaturday ? (
        <p className="text-red-500 text-center mb-4 text-lg font-medium">You can only request a meal on Saturdays.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="requestedMenu">
              What would you like to eat next week?
            </label>
            <textarea
              id="requestedMenu"
              placeholder="e.g., Khao Kha Moo, Boat Noodles"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800 h-28"
              value={requestedMenu}
              onChange={(e) => setRequestedMenu(e.target.value)}
              required
            ></textarea>
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            disabled={submitting || !isSaturday}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          {error && <p className="text-red-500 mt-4 text-center text-base">{error}</p>}
          {success && <p className="text-green-500 mt-4 text-center text-base">{success}</p>}
        </form>
      )}
    </div>
  );
};

export default MenuRequestForm;