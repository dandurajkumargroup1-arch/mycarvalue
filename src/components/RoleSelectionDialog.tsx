
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface RoleSelectionDialogProps {
  open: boolean;
  onRoleSelect: (role: 'Owner' | 'Agent' | 'Mechanic') => void;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onRoleSelect, onOpenChange }: RoleSelectionDialogProps) {
  const [selectedRole, setSelectedRole] = useState<'Owner' | 'Agent' | 'Mechanic' | null>(null);

  const handleSubmit = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>
            Please choose your role to personalize your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select onValueChange={(value: 'Owner' | 'Agent' | 'Mechanic') => setSelectedRole(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Owner">Car Owner</SelectItem>
              <SelectItem value="Agent">Agent / Dealer</SelectItem>
              <SelectItem value="Mechanic">Mechanic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!selectedRole}>
            Confirm and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
