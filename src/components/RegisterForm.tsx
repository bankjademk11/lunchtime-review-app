import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

interface RegisterFormProps {
  onRegisterSuccess: (token: string, userId: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setMessage('Username must be 3-20 alphanumeric characters.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setUsername('');
        setPassword('');
        setConfirmPassword(''); // Clear confirm password field as well
        // Assuming the backend returns token and userId on successful registration
        // This might require a change in the backend /api/register endpoint as well
        // For now, I'll assume it returns token and userId, and if not, I'll adjust the backend later.
        if (data.token && data.userId) {
          onRegisterSuccess(data.token, data.userId);
        }
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('Network error or server is down.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-4xl font-extrabold text-center mb-8 text-blue-600">Join Us!</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">Username:</label>
          <input
            type="text"
            id="username"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
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
        <div>
          <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold mb-2">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 text-gray-800"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          Register
        </button>
        {message && <p className={`mt-6 text-center text-base ${message.includes('failed') || message.includes('error') || message.includes('match') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
      </form>
    </div>
  );
};

export default RegisterForm;