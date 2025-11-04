import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'error' | 'success'
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Client-side validation
    if (!formData.userName.trim()) {
      setMessage('Please enter your username');
      setMessageType('error');
      return;
    }
    if (!formData.password) {
      setMessage('Please enter your password');
      setMessageType('error');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:9999/api'}/users/login`,
        {
          method: 'POST',
          credentials: 'include', // equivalent to withCredentials: true in axios
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: formData.userName,
            password: formData.password
          })
        }
      );

      const data = await response.json();
      console.log(data);
      if (response.ok && data.message === 'Login successfully') {
        localStorage.setItem('token', data.accessToken);
      
        setMessage('Login successful! Redirecting...');
        setMessageType('success');
      
        setTimeout(() => {
          switch (jwtDecode(data.accessToken).roleId) {
            case "r1":
              navigate('/admin/dashboard');
              break;
            case "r2":
              navigate('/teacher');
              break;
            case "r3":
              navigate('/student/my-classes');
              break;
            default:
              navigate('/login');
              break;
          }
        }, 1000);
      } else {
        setMessage(data.message || 'Invalid username or password');
        setMessageType('error');
      }
    } catch (err) {
      setMessage(err.message || 'Failed to login. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link 
            to="/register" 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        {message && (
  <div
    className={`mb-4 border-l-4 p-4 ${
      messageType === 'error'
        ? 'bg-red-50 border-red-400 text-red-700'
        : 'bg-green-50 border-green-400 text-green-700'
    }`}
  >
    <div className="flex">
      <div className="flex-shrink-0">
        {messageType === 'error' ? (
          // icon error
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : (
          // icon success
          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 10.707l-2-2a1 1 0 00-1.414 1.414l2.707 2.707a1 1 0 001.414 0l5.707-5.707a1 1 0 00-1.414-1.414l-5 5z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className="ml-3">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  </div>
)}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  required
                  value={formData.userName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
              <Link
  to="/forgot-password"
  className="font-medium text-indigo-600 hover:text-indigo-500"
>
  Forgot your password?
</Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
          </form>


        </div>
      </div>
    </div>
  );
};

export default LoginPage;