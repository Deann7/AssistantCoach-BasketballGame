"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { authAPI, ApiResponse, User } from '@/lib/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    isAssistant: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response: ApiResponse<User> = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age),
        isAssistant: formData.isAssistant
      });
      console.log(response)
      if (response.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/pages/login');
        }, 2000);      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorObj = error as { message?: string };
      const errorMessage = errorObj?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4">
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-w-5xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left side - Basketball themed image */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-orange-500 to-yellow-500 p-12 hidden md:flex flex-col justify-center items-center text-white">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center"
          >  
            <motion.div
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <Image 
                src="/basketball.svg" 
                alt="Basketball" 
                width={60} 
                height={60}
                className="mx-auto mb-6"
              />
            </motion.div>
            
            <motion.h2 
              className="text-3xl font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Join Imagine Basketball Team
            </motion.h2>
            
            <motion.p
              className="text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Become an assistant coach and start your basketball journey today!
            </motion.p>
          </motion.div>
        </div>
        
        {/* Right side - Registration form */}
        <div className="p-8 md:p-12 w-full md:w-3/5">
          <div className="flex items-center mb-6">
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
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Create Account</h3>
          
          {error && (
            <motion.div 
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </motion.div>
          )}
          
          <motion.form
            onSubmit={handleSubmit}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="mb-4" variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Username <span className="text-red-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </motion.div>
            
            <motion.div className="mb-4" variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email <span className="text-red-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </motion.div>
            
            <motion.div className="mb-4" variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password <span className="text-red-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </motion.div>
            
            <motion.div className="mb-4" variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="age">
                Age <span className="text-red-500">*</span>
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                id="age"
                name="age"
                type="number"
                placeholder="Enter your age"
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </motion.div>
            
            <motion.div className="mb-6" variants={itemVariants}>
              <div className="flex items-center">
                <input
                  className="h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 mr-2 cursor-pointer"
                  id="isAssistant"
                  name="isAssistant"
                  type="checkbox"
                  checked={formData.isAssistant}
                  onChange={handleChange}
                />
                <label className="text-gray-700 font-semibold" htmlFor="isAssistant">
                  Would You Like To be an assistant of Coach John Doe? <span className="text-red-500">*</span>
                </label>
              </div>
            </motion.div>
            
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none ${isLoading ? 'opacity-70' : 'hover:from-orange-600 hover:to-yellow-600'}`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Sign Up'
              )}
            </motion.button>
            
            <motion.p variants={itemVariants} className="mt-6 text-center text-gray-600">
              Already have an account?{' '}
              <Link href="/pages/login" className="text-orange-500 hover:text-orange-700 font-semibold">
                Sign in
              </Link>
            </motion.p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;