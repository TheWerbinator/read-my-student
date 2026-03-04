"use client";

import { School } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SendToSchoolDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size='sm'
          className='rounded-lg bg-amber-400 text-green-900 hover:bg-yellow-500 font-semibold'
        >
          <School className='mr-2 h-4 w-4' /> Send to School
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='font-serif text-green-900'>
            Send Recommendation
          </DialogTitle>
          <DialogDescription>
            Enter the destination email for the admissions office.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='school-name'>Institution Name</Label>
            <Input
              id='school-name'
              placeholder='e.g. Harvard Medical School'
              className='rounded-xl'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='school-email'>Admissions Email</Label>
            <Input
              id='school-email'
              placeholder='admissions@harvard.edu'
              className='rounded-xl'
            />
          </div>
          <div className='rounded-lg bg-slate-50 p-3 text-xs text-gray-500'>
            <span className='font-bold text-green-900'>Note:</span> This will
            generate a secure, one-time view link for the institution.
          </div>
        </div>
        <DialogFooter>
          <Button
            type='submit'
            className='w-full rounded-xl bg-green-900 hover:bg-[#093820]'
          >
            Send Secure Link ($5.00)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
