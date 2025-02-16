'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import PlaceSearch from "@/components/PlaceSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { categories } from '@/lib/constants';  
import { Place } from '@/types';

interface PlaceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (place: Place) => void;
  initialData?: Place;
  editMode?: boolean;
}

export default function PlaceForm({ open, onClose, onSubmit, initialData, editMode = false }: PlaceFormProps) {
  const [formData, setFormData] = useState<Place>(initialData || {
    name: '',
    category: 'cultural',
    short_description: '',
    full_description: '',
    image_url: '',
    location: { lat: 0, lng: 0 },
    address: '',
    opening_hours: '',
    website: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit Place' : 'Add New Place'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Place Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Short Description</Label>
              <Textarea
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Full Description</Label>
              <Textarea
                value={formData.full_description}
                onChange={(e) => setFormData(prev => ({ ...prev, full_description: e.target.value }))}
                className="min-h-[150px]"
                required
              />
            </div>

            <div>
              <Label>Place Image</Label>
              <ImageUpload
                value={formData.image_url ? [formData.image_url] : []}
                onChange={(urls) => setFormData(prev => ({ ...prev, image_url: urls[0] }))}
                bucket="avatars"
                folder={`explore/places/${formData.category}`}
              />
            </div>

            <div>
              <Label>Location</Label>
              <PlaceSearch
                onSelect={(placeData) => {
                  setFormData(prev => ({
                    ...prev,
                    name: placeData.name,
                    address: placeData.address,
                    location: placeData.coordinates
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Opening Hours</Label>
                <Input
                  placeholder="e.g., Mon-Sun: 9:00-18:00"
                  value={formData.opening_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, opening_hours: e.target.value }))}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editMode ? 'Update' : 'Add New'} Place
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 