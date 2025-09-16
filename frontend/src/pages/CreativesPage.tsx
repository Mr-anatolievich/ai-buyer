import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Image as ImageIcon, Video, Eye, Download, Upload } from 'lucide-react';

interface Creative {
  id: string;
  name: string;
  type: string;
  thumbnail: string;
  usage: number;
  lastUsed: string;
  performance: string;
  stats: {
    impressions: string;
    ctr: string;
    conversions: number;
    cpa: string;
  };
}

const MOCK_CREATIVES: Creative[] = [
  {
    id: '1',
    name: 'Summer Dress Hero Video',
    type: 'video',
    thumbnail: '/placeholder.svg',
    usage: 12,
    lastUsed: '2024-01-15',
    performance: 'high',
    stats: {
      impressions: '45.2K',
      ctr: '3.2%',
      conversions: 127,
      cpa: '$18.45'
    }
  },
  {
    id: '2',
    name: 'Beach Collection Carousel',
    type: 'image',
    thumbnail: '/placeholder.svg',
    usage: 8,
    lastUsed: '2024-01-12',
    performance: 'medium',
    stats: {
      impressions: '32.1K',
      ctr: '2.1%',
      conversions: 89,
      cpa: '$22.14'
    }
  },
  {
    id: '3',
    name: 'Holiday Promo Static',
    type: 'image',
    thumbnail: '/placeholder.svg',
    usage: 15,
    lastUsed: '2024-01-10',
    performance: 'high',
    stats: {
      impressions: '67.8K',
      ctr: '2.8%',
      conversions: 203,
      cpa: '$19.23'
    }
  },
  {
    id: '4',
    name: 'Brand Story Video',
    type: 'video',
    thumbnail: '/placeholder.svg',
    usage: 5,
    lastUsed: '2024-01-08',
    performance: 'low',
    stats: {
      impressions: '23.4K',
      ctr: '1.2%',
      conversions: 45,
      cpa: '$31.67'
    }
  },
  {
    id: '5',
    name: 'Product Showcase GIF',
    type: 'image',
    thumbnail: '/placeholder.svg',
    usage: 20,
    lastUsed: '2024-01-20',
    performance: 'high',
    stats: {
      impressions: '89.3K',
      ctr: '4.1%',
      conversions: 298,
      cpa: '$15.89'
    }
  },
  {
    id: '6',
    name: 'Testimonial Video',
    type: 'video',
    thumbnail: '/placeholder.svg',
    usage: 3,
    lastUsed: '2024-01-05',
    performance: 'medium',
    stats: {
      impressions: '18.7K',
      ctr: '2.3%',
      conversions: 67,
      cpa: '$24.12'
    }
  }
];

export default function CreativesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);

  const filteredCreatives = MOCK_CREATIVES.filter(creative => {
    const matchesSearch = creative.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || creative.type === typeFilter;
    const matchesPerformance = performanceFilter === 'all' || creative.performance === performanceFilter;
    
    return matchesSearch && matchesType && matchesPerformance;
  });

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'high':
        return <Badge className="bg-success text-success-foreground">High CTR</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium CTR</Badge>;
      case 'low':
        return <Badge variant="destructive">Low CTR</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creatives Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze your advertising creatives
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Creative
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search creatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High Performance</SelectItem>
                <SelectItem value="medium">Medium Performance</SelectItem>
                <SelectItem value="low">Low Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Creatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCreatives.map((creative) => (
          <Card key={creative.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted relative group">
              <div className="absolute inset-0 flex items-center justify-center">
                {creative.type === 'video' ? (
                  <Video className="w-12 h-12 text-muted-foreground" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => setSelectedCreative(creative)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{selectedCreative?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        {selectedCreative?.type === 'video' ? (
                          <Video className="w-16 h-16 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="w-16 h-16 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Performance Stats</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Impressions</div>
                              <div className="font-medium">{selectedCreative?.stats.impressions}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">CTR</div>
                              <div className="font-medium">{selectedCreative?.stats.ctr}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Conversions</div>
                              <div className="font-medium">{selectedCreative?.stats.conversions}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">CPA</div>
                              <div className="font-medium">{selectedCreative?.stats.cpa}</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Usage Details</h3>
                          <div className="text-sm space-y-1">
                            <div>Used in {selectedCreative?.usage} campaigns</div>
                            <div>Last used: {selectedCreative?.lastUsed}</div>
                            <div className="mt-2">{getPerformanceBadge(selectedCreative?.performance)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button size="sm" variant="secondary">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{creative.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {creative.type.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Used {creative.usage} times</span>
                  <span>{creative.lastUsed}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  {getPerformanceBadge(creative.performance)}
                  <span className="text-sm font-medium">CTR: {creative.stats.ctr}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCreatives.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No creatives found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your filters or upload new creatives to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}