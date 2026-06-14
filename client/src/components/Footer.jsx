import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h3 className="text-white font-bold mb-4">About PSTU</h3>
            <p className="text-sm">
              Patuakhali Science and Technology University - A leading institution for education and research.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => {}} className="hover:text-white transition">About Us</button>
              </li>
              <li>
                <button type="button" onClick={() => {}} className="hover:text-white transition">Contact</button>
              </li>
              <li>
                <button type="button" onClick={() => {}} className="hover:text-white transition">Privacy Policy</button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Contact Info</h3>
            <p className="text-sm">Email: info@pstu.edu.bd</p>
            <p className="text-sm">Phone: +880-700-123456</p>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-sm">
          <p>&copy; {currentYear} PSTU Web App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
