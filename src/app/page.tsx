"use client";

import React, { useState } from 'react';
import LandingPage from './pages/landingPage/page';
import Login from './pages/login/page';

export default function Home() {

    // In a real implementation, this would call the startNewGame function from GameContext
  
  return (
    <>
      <LandingPage />
    </>
  );
}
