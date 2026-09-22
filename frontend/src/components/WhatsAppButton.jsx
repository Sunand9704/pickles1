import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const WHATSAPP_NUMBER = '919702012861'; // +91 97020 12861

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed right-4 md:right-6 bottom-20 md:bottom-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a] hover:scale-105 transition-all duration-200"
    >
      <FaWhatsapp size={30} />
    </a>
  );
};

export default WhatsAppButton;
