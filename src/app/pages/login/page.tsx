"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { authAPI, ApiResponse, User } from '@/lib/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response: ApiResponse<User> = await authAPI.login({
        username,
        password
      });

      if (response.success) {
        // Store user data in localStorage (in production, consider using more secure storage)
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect to main menu
        router.push('/gamePage/mainMenu');
      } else {
        setError(response.message || 'Login failed');
      }    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorObj = error as { message?: string };
      setError(errorObj.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4">
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left side - Form */}
        <div className="p-8 md:p-12 w-full md:w-1/2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center mb-8">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 1 }}
                className="mr-3"
              >
                <Image 
                  src="/basketball.svg" 
                  alt="Basketball" 
                  width={32} 
                  height={32}
                />
              </motion.div>
              <h2 className="text-3xl font-bold text-orange-500">
                Assistant Coach
              </h2>
            </div>
              <h3 className="text-2xl font-semibold mb-6 text-gray-800">Welcome Back!</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-right mt-2">
                  <a className="text-sm text-blue-600 hover:text-blue-800" href="#">
                    Forgot password?
                  </a>
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none ${isLoading ? 'opacity-70' : 'hover:from-orange-600 hover:to-yellow-600'}`}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>
              <p className="mt-6 text-center text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/pages/register" className="text-orange-500 hover:text-orange-700 font-semibold">
                Sign up now
              </Link>
            </p>
          </motion.div>
        </div>
        
        {/* Right side - Image and text */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-orange-500 to-yellow-500 p-12 flex flex-col justify-center items-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-8 flex justify-center">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                }}
              >
                <Image 
                  src="/basketballBoy.svg" 
                  alt="Basketball Player" 
                  width={180} 
                  height={180}
                />
              </motion.div>
            </div>
            
            <motion.h2 
              className="text-3xl font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Join Coach John Doe
            </motion.h2>
            
            <motion.p
              className="text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Start your journey as an assistant coach and lead your team to victory!
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;