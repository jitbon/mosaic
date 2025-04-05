import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { Info, Globe, BarChart2, Users, BookOpen, ExternalLink } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="bg-blue-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">About Full Picture</h1>
            <p className="text-xl">
              Our mission is to provide balanced news perspectives to help you form your own informed opinions.
            </p>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="mb-4">
              In today's polarized media landscape, it's increasingly difficult to get the complete picture of complex events. 
              Full Picture was created to address this challenge by presenting diverse perspectives and comprehensive analysis 
              on important topics, helping you to understand different viewpoints and form your own informed opinions.
            </p>
            <p>
              We believe that understanding multiple perspectives is essential for civil discourse and thoughtful decision-making. 
              Our platform is designed to be politically neutral, focusing on presenting viewpoints fairly rather than advocating 
              for specific positions.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <Globe className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Comprehensive Coverage</h3>
                </div>
                <p>
                  We gather information from diverse sources across the political spectrum to provide a complete view of important events.
                </p>
              </div>
              
              <div className="border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <BarChart2 className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Impact Analysis</h3>
                </div>
                <p>
                  We analyze potential impacts of events across economic, social, global, and risk dimensions to help you understand their significance.
                </p>
              </div>
              
              <div className="border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <Users className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Multiple Perspectives</h3>
                </div>
                <p>
                  We present viewpoints from across the ideological spectrum, from conservative to progressive, as well as centrist and international perspectives.
                </p>
              </div>
              
              <div className="border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <BookOpen className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">Sources & Citations</h3>
                </div>
                <p>
                  We provide sources for all information and analysis, with transparency about potential biases and credibility.
                </p>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Team</h2>
            <p className="mb-6">
              Full Picture was created by a diverse team of journalists, researchers, technologists, and designers committed to improving 
              the quality of public discourse through balanced information.
            </p>
            <div className="text-center mt-8">
              <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Start Exploring
              </Link>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="mb-4">
              We welcome your feedback, questions, and suggestions for improving Full Picture.
            </p>
            <div className="flex items-center">
              <Info size={20} className="mr-2 text-blue-600" />
              <a href="mailto:info@fullpicture.app" className="text-blue-600 hover:underline">
                info@fullpicture.app
              </a>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;