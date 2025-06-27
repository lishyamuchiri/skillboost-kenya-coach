
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, MessageCircle, Trophy, Users, Star, Check, Smartphone, TrendingUp, Award, Clock, DollarSign, Zap } from 'lucide-react';
import EnrollmentFlow from '@/components/EnrollmentFlow';
import PaymentModal from '@/components/PaymentModal';

const Index = () => {
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const learningTracks = [
    {
      id: 'digital',
      title: 'Digital Skills Mastery',
      description: 'Social media marketing, Excel basics, online selling',
      icon: <Smartphone className="h-8 w-8" />,
      lessons: 21,
      duration: '3 weeks',
      color: 'bg-gradient-to-r from-blue-500 to-purple-600'
    },
    {
      id: 'english',
      title: 'Business English Pro',
      description: 'Professional communication, writing, presentations',
      icon: <MessageCircle className="h-8 w-8" />,
      lessons: 28,
      duration: '4 weeks',
      color: 'bg-gradient-to-r from-green-500 to-teal-600'
    },
    {
      id: 'entrepreneurship',
      title: 'Hustle & Business',
      description: 'Business planning, customer service, financial literacy',
      icon: <TrendingUp className="h-8 w-8" />,
      lessons: 35,
      duration: '5 weeks',
      color: 'bg-gradient-to-r from-orange-500 to-red-600'
    },
    {
      id: 'vocational',
      title: 'Professional Skills',
      description: 'Accounting basics, project management, sales techniques',
      icon: <Award className="h-8 w-8" />,
      lessons: 42,
      duration: '6 weeks',
      color: 'bg-gradient-to-r from-purple-500 to-pink-600'
    }
  ];

  const testimonials = [
    {
      name: "Grace Wanjiku",
      role: "Small Business Owner",
      content: "SkillBoost helped me learn digital marketing in just 5 minutes a day. My sales doubled!",
      rating: 5
    },
    {
      name: "Peter Kamau",
      role: "University Student",
      content: "Perfect for my busy schedule. The WhatsApp lessons are so convenient!",
      rating: 5
    },
    {
      name: "Mary Achieng",
      role: "Freelancer",
      content: "Improved my English skills and got better clients. Worth every shilling!",
      rating: 5
    }
  ];

  const handleStartLearning = () => {
    setShowEnrollment(true);
  };

  const handlePayNow = (plan: string) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
        <div className="relative max-w-6xl mx-auto">
          <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 text-sm font-medium animate-bounce">
            🏆 40,000 KES Prize Challenge Winner
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-fade-in">
            SkillBoost Kenya
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-fade-in">
            Master new skills with <span className="font-bold text-blue-600">5-minute daily lessons</span> 
            delivered straight to your WhatsApp. No apps to download!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={handleStartLearning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Learning FREE
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handlePayNow('premium')}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Go Premium - KES 150/month
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center animate-scale-in">
              <div className="text-2xl font-bold text-blue-600">5000+</div>
              <div className="text-sm text-gray-600">Active Learners</div>
            </div>
            <div className="text-center animate-scale-in">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center animate-scale-in">
              <div className="text-2xl font-bold text-purple-600">5 min</div>
              <div className="text-sm text-gray-600">Daily Commitment</div>
            </div>
            <div className="text-center animate-scale-in">
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-600">WhatsApp Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose SkillBoost Kenya?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>WhatsApp Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  No apps to download! Receive personalized lessons directly on WhatsApp at your convenience.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Just 5 Minutes Daily</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Perfect for busy hustlers and students. Micro-lessons that fit into any schedule.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                  <Trophy className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Earn Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get recognized completion certificates to boost your career and earning potential.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Learning Tracks */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Choose Your Learning Track</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningTracks.map((track) => (
              <Card key={track.id} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <div className={`absolute inset-0 ${track.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <CardHeader className="relative">
                  <div className={`w-16 h-16 rounded-lg ${track.color} flex items-center justify-center text-white mb-4`}>
                    {track.icon}
                  </div>
                  <CardTitle className="text-lg">{track.title}</CardTitle>
                  <CardDescription>{track.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>{track.lessons} lessons</span>
                    <span>{track.duration}</span>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => handleStartLearning()}
                  >
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Simple, Affordable Pricing</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative">
              <CardHeader>
                <CardTitle>Free Trial</CardTitle>
                <div className="text-3xl font-bold">KES 0</div>
                <CardDescription>3 lessons per week</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />WhatsApp lessons</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Basic progress tracking</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Community access</li>
                </ul>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleStartLearning}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-blue-600 shadow-lg">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">Most Popular</Badge>
              <CardHeader>
                <CardTitle>Weekly Plan</CardTitle>
                <div className="text-3xl font-bold">KES 50</div>
                <CardDescription>per week</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Unlimited lessons</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />All learning tracks</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Progress certificates</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Priority support</li>
                </ul>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handlePayNow('weekly')}
                >
                  Pay KES 50/week
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Plan</CardTitle>
                <div className="text-3xl font-bold">KES 150</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Everything in Weekly</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Advanced analytics</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />1-on-1 coaching</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-green-600 mr-2" />Job placement support</li>
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => handlePayNow('monthly')}
                >
                  Pay KES 150/month
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Success Stories</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Boost Your Skills?</h2>
          <p className="text-xl mb-8">Join thousands of Kenyan professionals already learning with SkillBoost</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleStartLearning}
              className="px-8 py-4 text-lg font-semibold"
            >
              Start FREE Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handlePayNow('premium')}
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold"
            >
              Go Premium Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">SkillBoost Kenya</h3>
          <p className="text-gray-400 mb-6">Empowering Kenyan professionals through micro-learning</p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Contact Us</a>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-700 text-sm text-gray-400">
            © 2024 SkillBoost Kenya. Built for Vibe Coding Hackathon 2.0
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EnrollmentFlow 
        open={showEnrollment}
        onOpenChange={setShowEnrollment}
        learningTracks={learningTracks}
        onPayment={(plan) => handlePayNow(plan)}
      />
      
      <PaymentModal
        open={showPayment}
        onOpenChange={setShowPayment}
        plan={selectedPlan}
      />
    </div>
  );
};

export default Index;
