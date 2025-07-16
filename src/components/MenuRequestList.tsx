import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface MenuRequest {
  id: number;
  request_date: string;
  requested_menu: string;
}

interface MenuRequestListProps {
  refreshTrigger: number;
}

const MenuRequestList: React.FC<MenuRequestListProps> = ({ refreshTrigger }) => {
  const [menuRequests, setMenuRequests] = useState<MenuRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3001/api/menu-requests');
      setMenuRequests(response.data);
    } catch (err) {
      setError('ไม่สามารถดึงคำขอเมนูได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuRequests();
  }, [refreshTrigger]);

  if (loading) return <p className="text-center text-lg">กำลังโหลดคำขอเมนู...</p>;
  if (error) return <p className="text-center text-red-500 text-lg">ข้อผิดพลาด: {error}</p>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mt-6 border border-gray-200">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center">All Meal Requests</h2>
      {menuRequests.length === 0 ? (
        <p className="text-gray-500 text-lg text-center py-4">No meal requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Requested Meal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {menuRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4 text-gray-700">{request.request_date}</td>
                  <td className="py-4 px-4 text-gray-700">{request.requested_menu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MenuRequestList;