import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface LoginFormProps {
  onLoginSuccess: (token: string, userId: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(API_BASE_URL + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        console.log('Token from backend:', data.token);
        console.log('User ID from backend:', data.userId);
        onLoginSuccess(data.token, data.userId);
        setUsername('');
        setPassword('');
        navigate('/'); // Redirect to home page after successful login
        console.log('Navigated to home page.');
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('Network error or server is down.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-4xl font-extrabold text-center mb-8 text-blue-600">Welcome Back!</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">Username:</label>
          <input
            type="text"
            id="username"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password:</label>
          <input
            type="password"
            id="password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          Login
        </button>
        {message && <p className={`mt-6 text-center text-base ${message.includes('failed') || message.includes('error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
      </form>
    </div>
  );
};

export default LoginForm;