import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import AIChatWidget from './AIChatWidget';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 min-w-0 dark:bg-gray-900 dark:text-gray-100">
          {children}
        </main>
      </div>
      <Footer />
      <BottomNav />
      <AIChatWidget />
    </div>
  );
};

export default Layout;
