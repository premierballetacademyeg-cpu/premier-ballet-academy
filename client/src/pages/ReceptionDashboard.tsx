import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

export default function ReceptionDashboard() {
  const [search, setSearch] = useState('');
  
  const { data: parents, isLoading } = trpc.listParents.useQuery({ query: search });

  const handleSendWhatsApp = (parent: any) => {
    let cleanPhone = parent.phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('200')) {
      cleanPhone = '20' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = '20' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('20')) {
      cleanPhone = '20' + cleanPhone;
    }

    // Dynamically use the current domain (works for localhost testing AND production!)
    const formLink = `${window.location.origin}/parent-form?token=${parent.token}`;
    const rawMessage = `Hi there,\n\nPremier Ballet Academy asks you to review and update the information we have for ${parent.childName}, read the School Policy, and confirm it before submitting.\n\nPlease open your private form here:\n${formLink}\n\nThank you,\nPremier Ballet Academy`;
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reception Dashboard</h1>
        <Button>+ Add New Parent</Button>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <Input 
          placeholder="Search by name, phone..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="max-w-md"
        />
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Child Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Policy Status</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
                  Loading families...
                </TableCell>
              </TableRow>
            ) : parents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No families found.
                </TableCell>
              </TableRow>
            ) : parents?.map((parent) => (
              <TableRow key={parent.id}>
                <TableCell className="font-medium">{parent.childName}</TableCell>
                <TableCell>{parent.phone}</TableCell>
                <TableCell>
                  <Badge variant={parent.policy === 'accepted' ? 'default' : 'destructive'}>
                    {parent.policy === 'accepted' ? 'Confirmed' : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={parent.membershipTier === 'loyalty_member' ? 'bg-amber-100 text-amber-800' : ''}>
                    {parent.membershipTier === 'loyalty_member' ? 'Loyalty' : 'Member'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleSendWhatsApp(parent)}>
                    Send WhatsApp Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
