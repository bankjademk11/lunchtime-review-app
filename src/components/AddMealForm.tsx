import React, { useState } from 'react';
import axios from 'axios';

interface AddMealFormProps {
  onMealAdded: () => void;
}

const AddMealForm: React.FC<AddMealFormProps> = ({ onMealAdded }) => {
  const [date, setDate] = useState<string>('');
  const [menu, setMenu] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
      setImageUrl(''); // Clear image URL if a file is selected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    let finalImageUrl = imageUrl;

    // If a file is selected, upload it first
    if (selectedFile) {
      const formData = new FormData();
      formData.append('mealImage', selectedFile);

      try {
        const uploadRes = await axios.post('http://localhost:3001/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        finalImageUrl = uploadRes.data.imageUrl;
      } catch (err) {
        setError('ไม่สามารถอัปโหลดรูปภาพได้');
        console.error(err);
        setSubmitting(false);
        return;
      }
    }

    try {
      await axios.post('http://localhost:3001/api/meals', {
        date,
        menu,
        imageUrl: finalImageUrl,
      });
      setSuccess('เพิ่มเมนูอาหารสำเร็จ!');
      setDate('');
      setMenu('');
      setImageUrl('');
      setSelectedFile(null);
      onMealAdded(); // Notify parent component to refresh data
    } catch (err) {
      setError('ไม่สามารถเพิ่มเมนูอาหารได้');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center">Add New Meal</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="date">
            Date:
          </label>
          <input
            type="date"
            id="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="menu">
            Menu:
          </label>
          <textarea
            id="menu"
            placeholder="e.g., Pad Krapow Moo Saap"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800 h-28"
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            required
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="imageUrl">
            Image URL:
          </label>
          <input
            type="text"
            id="imageUrl"
            placeholder="Paste image URL here"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setSelectedFile(null);
            }}
            disabled={!!selectedFile}
          />
        </div>
        <div className="text-center">
          <span className="text-gray-500 font-medium">OR</span>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="fileUpload">
            Upload Image:
          </label>
          <input
            type="file"
            id="fileUpload"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
            onChange={handleFileChange}
            accept="image/*"
            disabled={!!imageUrl}
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          disabled={submitting}
        >
          {submitting ? 'Adding...' : 'Add Meal'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center text-base">{error}</p>}
        {success && <p className="text-green-500 mt-4 text-center text-base">{success}</p>}
      </form>
    </div>
  );
};

export default AddMealForm;