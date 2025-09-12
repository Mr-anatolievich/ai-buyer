import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { MapPin, Users, MessageSquare, Search, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';

// Mock data - in real app, this would come from public/data/templates.json
const MOCK_TEMPLATES = {
  geoTemplates: [
    {
      id: '1',
      name: 'Україна + суміжні країни',
      locations: ['Ukraine', 'Poland', 'Romania', 'Moldova'],
      description: 'Target Ukraine and neighboring countries'
    },
    {
      id: '2', 
      name: 'Tier-1 English',
      locations: ['United States', 'Canada', 'United Kingdom', 'Australia'],
      description: 'Major English-speaking markets'
    },
    {
      id: '3',
      name: 'EU Core Markets',
      locations: ['Germany', 'France', 'Spain', 'Italy', 'Netherlands'],
      description: 'Core European Union markets'
    }
  ],
  copyTemplates: [
    {
      id: '1',
      category: 'E-commerce',
      headline: 'Shop the Latest Collection',
      primaryText: 'Discover our newest arrivals with exclusive designs that blend style and comfort. Limited time offer - get 20% off your first order!',
      description: 'Free shipping on orders over $50'
    },
    {
      id: '2',
      category: 'SaaS',
      headline: 'Boost Your Productivity Today',
      primaryText: 'Join thousands of professionals who use our platform to streamline their workflow and achieve better results. Start your free trial now!',
      description: 'No credit card required'
    },
    {
      id: '3',
      category: 'Health & Fitness',
      headline: 'Transform Your Body in 30 Days',
      primaryText: 'Get access to personalized workout plans and nutrition guidance from certified trainers. Start your fitness journey today!',
      description: 'Money-back guarantee'
    }
  ],
  audienceTemplates: [
    {
      id: '1',
      name: 'Fashion Enthusiasts',
      interests: ['Fashion', 'Online shopping', 'Clothing', 'Beauty', 'Style'],
      ageRange: [18, 45] as [number, number],
      gender: 'female' as const,
      description: 'Women interested in fashion and beauty'
    },
    {
      id: '2',
      name: 'Tech Early Adopters',
      interests: ['Technology', 'Gadgets', 'Innovation', 'Startups', 'Software'],
      ageRange: [25, 50] as [number, number],
      gender: 'all' as const,
      description: 'Tech-savvy individuals who love new technology'
    },
    {
      id: '3',
      name: 'Fitness Motivated',
      interests: ['Fitness', 'Gym', 'Health', 'Nutrition', 'Wellness'],
      ageRange: [20, 40] as [number, number],
      gender: 'all' as const,
      description: 'People interested in fitness and healthy lifestyle'
    }
  ]
};

export function TemplatesTab() {
  const { draft, updateAdSetDraft, updateAdDraft } = useAppStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const applyGeoTemplate = (template: typeof MOCK_TEMPLATES.geoTemplates[0]) => {
    updateAdSetDraft({
      target: {
        ...draft.adSet.target,
        location: template.locations[0] // Apply first location
      }
    });
    
    toast({
      title: "Geography template applied",
      description: `Applied ${template.name} targeting`,
    });
  };

  const applyCopyTemplate = (template: typeof MOCK_TEMPLATES.copyTemplates[0]) => {
    updateAdDraft({
      creative: {
        ...draft.ad.creative,
        headline: template.headline,
        primaryText: template.primaryText,
        description: template.description
      }
    });
    
    toast({
      title: "Copy template applied",
      description: `Applied ${template.category} copy template`,
    });
  };

  const applyAudienceTemplate = (template: typeof MOCK_TEMPLATES.audienceTemplates[0]) => {
    updateAdSetDraft({
      target: {
        ...draft.adSet.target,
        interests: template.interests,
        ageRange: template.ageRange,
        gender: template.gender
      }
    });
    
    toast({
      title: "Audience template applied",
      description: `Applied ${template.name} audience targeting`,
    });
  };

  const filteredCopyTemplates = MOCK_TEMPLATES.copyTemplates.filter(template =>
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.primaryText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Comments & Templates</h2>
        <p className="text-muted-foreground mt-1">
          Use pre-built templates to quickly populate your campaign settings
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Geo Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geo Presets
          </CardTitle>
          <CardDescription>
            Quick geographic targeting presets for different markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_TEMPLATES.geoTemplates.map((template) => (
              <Card key={template.id} className="border-muted">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.locations.map((location) => (
                        <Badge key={location} variant="outline" className="text-xs">
                          {location}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyGeoTemplate(template)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Apply to Ad Set
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Copywriting Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Copywriting Templates
          </CardTitle>
          <CardDescription>
            Proven ad copy templates for different industries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCopyTemplates.map((template) => (
              <Card key={template.id} className="border-muted">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>{template.category}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground">Headline</h5>
                        <p className="font-medium">{template.headline}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground">Primary Text</h5>
                        <p className="text-sm">{template.primaryText}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground">Description</h5>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyCopyTemplate(template)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Apply to Ad
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audience Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Audience Presets
          </CardTitle>
          <CardDescription>
            Pre-configured audience segments for common target groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_TEMPLATES.audienceTemplates.map((template) => (
              <Card key={template.id} className="border-muted">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span>{template.ageRange[0]}-{template.ageRange[1]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="capitalize">{template.gender}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {template.interests.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyAudienceTemplate(template)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Apply to Ad Set
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}