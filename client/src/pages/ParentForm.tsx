import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentForm() {
  const [_, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token') || '';
  
  const { data: member, isLoading } = trpc.getParent.useQuery({ token }, { enabled: !!token });
  const submitMutation = trpc.submitForm.useMutation();

  const [formData, setFormData] = useState({
    childName: '',
    birthDate: '',
    guardianName: '',
    guardianEmail: '',
    phone: '',
    medicalCond: '',
    previousExperience: '',
    isLoyaltyMember: false,
    policyConfirmed: false,
  });

  useEffect(() => {
    if (member) {
      setFormData({
        childName: member.childName || '',
        birthDate: member.birthDate || '',
        guardianName: member.guardianName || '',
        guardianEmail: member.guardianEmail || '',
        phone: member.phone || '',
        medicalCond: member.medicalCond || '',
        previousExperience: member.previousExperience || '',
        isLoyaltyMember: member.isLoyaltyMember === 'loyalty_member',
        policyConfirmed: member.policyConfirmed === 'accepted',
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyConfirmed) {
      toast.error("Please confirm the school policy.");
      return;
    }
    
    try {
      await submitMutation.mutateAsync({
        token,
        ...formData
      });
      toast.success('Thank you! Your information has been updated and your virtual card will be emailed shortly.');
      // Keep them on the success state
    } catch (err) {
      toast.error('Failed to submit form. Please try again.');
    }
  };

  if (!token) {
    return <div className="p-8 text-center text-red-500 font-bold">Invalid link. No token provided.</div>;
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  if (submitMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full mx-auto text-center space-y-8 bg-white p-8 rounded-xl shadow-lg border-t-8 border-green-500">
          <h2 className="text-3xl font-bold text-gray-900">Success!</h2>
          <p className="text-lg text-gray-600">Your profile has been updated perfectly.</p>
          <p className="text-sm text-gray-500">Your virtual member card is being generated and will be sent to <strong>{formData.guardianEmail}</strong> shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <img src="/premier-ballet-academy-logo_309ebba2.png" alt="Logo" className="mx-auto h-24 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Parent Registration & Update</h2>
          <p className="mt-2 text-sm text-gray-600">Review and update your information.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="childName">Child Name</Label>
              <Input id="childName" value={formData.childName} onChange={e => setFormData({...formData, childName: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="birthDate">Date of Birth</Label>
              <Input type="date" id="birthDate" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="guardianName">Parent/Guardian Name</Label>
              <Input id="guardianName" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="guardianEmail">Parent/Guardian Email</Label>
              <Input type="email" id="guardianEmail" value={formData.guardianEmail} onChange={e => setFormData({...formData, guardianEmail: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
              <Input type="tel" id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="medicalCond">Medical Conditions</Label>
              <Input id="medicalCond" value={formData.medicalCond} onChange={e => setFormData({...formData, medicalCond: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="previousExperience">Previous Experience</Label>
              <Input id="previousExperience" value={formData.previousExperience} onChange={e => setFormData({...formData, previousExperience: e.target.value})} />
            </div>
            
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox id="loyalty" checked={formData.isLoyaltyMember} onCheckedChange={(checked) => setFormData({...formData, isLoyaltyMember: !!checked})} />
              <Label htmlFor="loyalty" className="font-semibold text-amber-600">Upgrade to Loyalty Member (Optional)</Label>
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox id="policy" checked={formData.policyConfirmed} onCheckedChange={(checked) => setFormData({...formData, policyConfirmed: !!checked})} required />
              <Label htmlFor="policy">I have read and confirm the School Policy.</Label>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Submit & Generate Virtual Card
          </Button>
        </form>
      </div>
    </div>
  );
}
