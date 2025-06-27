
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageCircle, Clock, Trophy, ArrowRight } from 'lucide-react';

interface EnrollmentFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learningTracks: any[];
  onPayment: (plan: string) => void;
}

const EnrollmentFlow = ({ open, onOpenChange, learningTracks, onPayment }: EnrollmentFlowProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    selectedTracks: [] as string[],
    preferredTime: '09:00'
  });

  const handleTrackSelect = (trackId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTracks: prev.selectedTracks.includes(trackId)
        ? prev.selectedTracks.filter(id => id !== trackId)
        : [...prev.selectedTracks, trackId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.whatsapp || formData.selectedTracks.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Store enrollment data
      const enrollmentData = {
        ...formData,
        enrolledAt: new Date().toISOString(),
        status: 'free_trial'
      };
      
      localStorage.setItem('skillboost_enrollment', JSON.stringify(enrollmentData));
      
      // Send welcome WhatsApp message
      await sendWelcomeMessage(formData.whatsapp, formData.name, formData.selectedTracks);
      
      toast.success("Welcome to SkillBoost! Check your WhatsApp for your first lesson.");
      onOpenChange(false);
      setStep(1);
      
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error("Enrollment failed. Please try again.");
    }
  };

  const sendWelcomeMessage = async (whatsapp: string, name: string, tracks: string[]) => {
    // This would integrate with WhatsApp Business API
    console.log('Sending welcome message to:', whatsapp);
    
    const welcomeMessage = `
🎉 Welcome to SkillBoost Kenya, ${name}!

You've successfully enrolled in:
${tracks.map(trackId => {
      const track = learningTracks.find(t => t.id === trackId);
      return `• ${track?.title}`;
    }).join('\n')}

🔥 Your first 5-minute lesson will arrive tomorrow at ${formData.preferredTime}.

Reply with:
• NEXT - Get next lesson
• STOP - Pause lessons
• HELP - Get support

Ready to boost your skills? Let's go! 💪
    `;
    
    // Simulate API call to WhatsApp Business API
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="e.g., +254712345678"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">We'll send your lessons here daily</p>
                </div>
                <div>
                  <Label htmlFor="time">Preferred Lesson Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">
              Next: Choose Learning Tracks
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Learning Tracks</h3>
              <p className="text-sm text-gray-600 mb-4">Choose one or more tracks that interest you</p>
              
              <div className="grid gap-4">
                {learningTracks.map((track) => (
                  <Card 
                    key={track.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      formData.selectedTracks.includes(track.id) 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleTrackSelect(track.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${track.color} text-white flex-shrink-0`}>
                          {track.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{track.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{track.description}</p>
                          <div className="flex space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {track.duration}
                            </span>
                            <span>{track.lessons} lessons</span>
                          </div>
                        </div>
                        {formData.selectedTracks.includes(track.id) && (
                          <Badge className="bg-blue-500">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                className="flex-1"
                disabled={formData.selectedTracks.length === 0}
              >
                Next: Review & Start
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Enrollment</h3>
              
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">WhatsApp:</span>
                      <span className="font-medium">{formData.whatsapp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lesson Time:</span>
                      <span className="font-medium">{formData.preferredTime}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 block mb-2">Selected Tracks:</span>
                      {formData.selectedTracks.map(trackId => {
                        const track = learningTracks.find(t => t.id === trackId);
                        return (
                          <Badge key={trackId} className="mr-2 mb-2">
                            {track?.title}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Free Trial Included!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Start with 3 free lessons per week. Upgrade anytime for unlimited access.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700">
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Learning for FREE
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => onPayment('premium')} 
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Upgrade to Premium - KES 150/month
              </Button>
              
              <Button variant="ghost" onClick={() => setStep(2)} className="w-full">
                Back to Track Selection
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Join SkillBoost Kenya</DialogTitle>
          <DialogDescription>
            Start your microlearning journey with personalized WhatsApp lessons
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentFlow;
