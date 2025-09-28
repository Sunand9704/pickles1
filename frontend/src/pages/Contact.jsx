import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Create WhatsApp message
      const whatsappMessage = `Name: ${formData.name}%0A` +
        `Email: ${formData.email}%0A` +
        `Phone: ${formData.phone}%0A` +
        `Subject: ${formData.subject}%0A` +
        `Message: ${formData.message}`;

      // Open WhatsApp with pre-filled message
      window.open(`https://wa.me/919701555435?text=${whatsappMessage}`, '_blank');

      setSubmitStatus({ type: 'success', message: 'Thank you for your message! We will get back to you soon.' });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: (
        <img 
          src="https://cdn-icons-png.flaticon.com/512/126/126341.png" 
          alt="Phone" 
          className="w-6 h-6"
        />
      ),
      title: 'Phone',
      content: '+91 970-155-5435',
      link: 'tel:+919701555435'
    },
    {
      icon: (
        <img 
          src="https://cdn-icons-png.flaticon.com/512/3178/3178158.png" 
          alt="Email" 
          className="w-6 h-6"
        />
      ),
      title: 'Email',
      content: 'maammaruchulu@gmail.com',
      link: 'mailto:maammaruchulu@gmail.com'
    },
    {
      icon: (
        <img 
          src="https://cdn-icons-png.flaticon.com/512/2776/2776067.png" 
          alt="Address" 
          className="w-6 h-6"
        />
      ),
      title: 'Address',
      content: '4-7-62/2, Shivaji nagar, Attapur, Hyderabad-500048',
      link: 'https://maps.app.goo.gl/BV9XeQPSCLEXyyky7'
    },
    {
      icon: (
        <img 
          src="https://cdn-icons-png.flaticon.com/512/733/733585.png" 
          alt="WhatsApp" 
          className="w-6 h-6"
        />
      ),
      title: 'WhatsApp',
      content: 'Chat with us on WhatsApp',
      link: 'https://wa.me/919701555435'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <div className="w-20 h-1 bg-primary-600 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Have questions about our products or services? We're here to help!
            </p>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-8 md:p-12"
          >
            <div className="grid grid-cols-1 gap-8 justify-items-center">
              {/* Contact Information */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Get in Touch</h2>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{info.title}</h3>
                        <a
                          href={info.link}
                          className="text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          {info.content}
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Contact Form */}
              
            </div>

            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Location</h2>
              <div className="relative rounded-xl overflow-hidden h-96 shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.0076939999997!2d77.5946143!3d12.9715987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBangalore%20Palace!5e0!3m2!1sen!2sin!4v1647851234567!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>
              <div className="mt-4 flex items-center justify-center space-x-4">
                <a
                  href="https://maps.google.com/?q=123+Dairy+Street,+Milk+Colony,+City+-+123456"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Open in Google Maps
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 