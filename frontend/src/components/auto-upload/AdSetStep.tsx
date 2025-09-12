import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { X, Plus, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Gender } from '@/store/useAppStore';

const POPULAR_INTERESTS = [
  'Fashion', 'Online shopping', 'Clothing', 'Beauty', 'Fitness',
  'Travel', 'Food', 'Technology', 'Photography', 'Art',
  'Music', 'Movies', 'Books', 'Sports', 'Gaming'
];

const LOCATIONS = [
  'United States', 'Canada', 'United Kingdom', 'Australia',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands',
  'Ukraine', 'Poland', 'Czech Republic'
];

export function AdSetStep() {
  const { draft, updateAdSetDraft, validateStep } = useAppStore();
  const { adSet } = draft;
  const [newInterest, setNewInterest] = useState('');

  const isValid = validateStep(2);

  const handleLocationChange = (value: string) => {
    updateAdSetDraft({
      target: { ...adSet.target, location: value }
    });
  };

  const handleGenderChange = (value: Gender) => {
    updateAdSetDraft({
      target: { ...adSet.target, gender: value }
    });
  };

  const handleAgeRangeChange = (values: number[]) => {
    updateAdSetDraft({
      target: { ...adSet.target, ageRange: [values[0], values[1]] as [number, number] }
    });
  };

  const addInterest = (interest: string) => {
    if (interest && !adSet.target.interests.includes(interest)) {
      updateAdSetDraft({
        target: {
          ...adSet.target,
          interests: [...adSet.target.interests, interest]
        }
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    updateAdSetDraft({
      target: {
        ...adSet.target,
        interests: adSet.target.interests.filter(i => i !== interest)
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Ad Set Name */}
      <div className="space-y-2">
        <Label htmlFor="adset-name">Ad Set Name *</Label>
        <Input
          id="adset-name"
          value={adSet.name}
          onChange={(e) => updateAdSetDraft({ name: e.target.value })}
          placeholder="e.g., Women 25-35 Fashion Lovers"
          className={!adSet.name.trim() && !isValid ? 'border-destructive' : ''}
        />
        {!adSet.name.trim() && !isValid && (
          <p className="text-sm text-destructive">Ad set name is required</p>
        )}
      </div>

      <Separator />

      {/* Audience Targeting */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Audience</h3>
          <p className="text-sm text-muted-foreground">Define who you want to reach with your ads</p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Location *</Label>
          <Select value={adSet.target.location} onValueChange={handleLocationChange}>
            <SelectTrigger className={!adSet.target.location.trim() && !isValid ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select target location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!adSet.target.location.trim() && !isValid && (
            <p className="text-sm text-destructive">Location is required</p>
          )}
        </div>

        {/* Age Range */}
        <div className="space-y-3">
          <Label>Age Range *</Label>
          <div className="px-3">
            <Slider
              min={13}
              max={65}
              step={1}
              value={adSet.target.ageRange}
              onValueChange={handleAgeRangeChange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>13</span>
              <span className="font-medium">
                {adSet.target.ageRange[0]} - {adSet.target.ageRange[1]} years old
              </span>
              <span>65+</span>
            </div>
          </div>
          {(adSet.target.ageRange[0] < 18 || adSet.target.ageRange[1] > 65 || 
            adSet.target.ageRange[0] > adSet.target.ageRange[1]) && !isValid && (
            <p className="text-sm text-destructive">Age range must be between 18-65 years</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={adSet.target.gender} onValueChange={handleGenderChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Detailed Targeting */}
        <div className="space-y-3">
          <Label>Detailed Targeting (Interests)</Label>
          <p className="text-sm text-muted-foreground">
            Add interests, behaviors, and demographics to reach the right people
          </p>
          
          {/* Current Interests */}
          {adSet.target.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {adSet.target.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="gap-1">
                  {interest}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto p-0 w-4 h-4"
                    onClick={() => removeInterest(interest)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add New Interest */}
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add an interest..."
              onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addInterest(newInterest)}
              disabled={!newInterest.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Popular Interests */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Popular interests:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_INTERESTS.filter(interest => 
                !adSet.target.interests.includes(interest)
              ).map((interest) => (
                <Button
                  key={interest}
                  variant="outline"
                  size="sm"
                  onClick={() => addInterest(interest)}
                  className="h-7"
                >
                  {interest}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Placements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            Placements
          </CardTitle>
          <CardDescription>
            Where your ads will appear across Facebook's family of apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Advantage+ Placements</strong> is selected by default. 
              This allows Facebook to automatically place your ads where they're likely to perform best.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Estimated Audience Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated Audience Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-primary">2.4M - 3.1M</div>
            <div className="text-sm text-muted-foreground">people in your target audience</div>
            <div className="w-full bg-muted rounded-full h-2 mt-4">
              <div className="bg-primary h-2 rounded-full w-3/4"></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your audience size is in the optimal range for effective targeting
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}