import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-primary">Skypoint</span>
            <span className="text-lg font-bold text-accent">.ai</span>
          </div>
          <p className="text-sm text-gray-500">AI Agents for Healthcare</p>
          <p className="text-sm text-gray-400">© 2025 Skypoint.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
