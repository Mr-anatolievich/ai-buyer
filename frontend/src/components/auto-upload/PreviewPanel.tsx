import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, Image as ImageIcon, Video, Globe } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function PreviewPanel() {
  const { draft, currentStep } = useAppStore();
  const { campaign, adSet, ad } = draft;

  const renderCreativePreview = () => {
    if (ad.creative.media) {
      const isVideo = ad.creative.media instanceof File && ad.creative.media.type.startsWith('video/');
      return (
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border">
          {isVideo ? (
            <Video className="w-12 h-12 text-primary" />
          ) : (
            <ImageIcon className="w-12 h-12 text-primary" />
          )}
        </div>
      );
    }
    
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No media uploaded</p>
        </div>
      </div>
    );
  };

  const getCtaButtonText = (cta: string) => {
    const ctaMap = {
      'LEARN_MORE': 'Learn More',
      'SHOP_NOW': 'Shop Now',
      'SIGN_UP': 'Sign Up',
      'CONTACT_US': 'Contact Us',
      'DOWNLOAD': 'Download'
    };
    return ctaMap[cta as keyof typeof ctaMap] || 'Learn More';
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Live Preview
        </CardTitle>
        <CardDescription>
          See how your ad will look to users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campaign Summary */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Campaign Overview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="text-right max-w-[120px] truncate">
                {campaign.name || 'Untitled Campaign'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Objective:</span>
              <Badge variant="outline" className="text-xs">
                {campaign.objective}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget:</span>
              <span>
                ${campaign.dailyBudget}/{campaign.budgetType === 'daily' ? 'day' : 'lifetime'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ad Set Summary */}
        {currentStep >= 2 && (
          <>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Targeting</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ad Set:</span>
                  <span className="text-right max-w-[120px] truncate">
                    {adSet.name || 'Untitled Ad Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-right max-w-[120px] truncate">
                    {adSet.target.location || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span>{adSet.target.ageRange[0]}-{adSet.target.ageRange[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="capitalize">{adSet.target.gender}</span>
                </div>
                {adSet.target.interests.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs">Interests:</span>
                    <div className="flex flex-wrap gap-1">
                      {adSet.target.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {adSet.target.interests.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{adSet.target.interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Ad Preview */}
        {currentStep >= 3 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Ad Preview</h4>
            
            {/* Mock Facebook Ad */}
            <div className="border rounded-lg overflow-hidden bg-card">
              {/* Ad Header */}
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-bold">YB</span>
                  </div>
                  <div className="text-xs">
                    <div className="font-medium">Your Business</div>
                    <div className="text-muted-foreground">Sponsored</div>
                  </div>
                </div>
              </div>

              {/* Ad Content */}
              <div className="space-y-3">
                {/* Primary Text */}
                {ad.creative.primaryText && (
                  <div className="px-3 pt-3">
                    <p className="text-sm">
                      {ad.creative.primaryText || 'Your primary text will appear here...'}
                    </p>
                  </div>
                )}

                {/* Media */}
                <div className="px-3">
                  {renderCreativePreview()}
                </div>

                {/* Headline & Description */}
                <div className="px-3 pb-3 space-y-1">
                  {ad.creative.headline && (
                    <h5 className="font-medium text-sm">
                      {ad.creative.headline}
                    </h5>
                  )}
                  {ad.creative.description && (
                    <p className="text-xs text-muted-foreground">
                      {ad.creative.description}
                    </p>
                  )}
                  
                  {/* Website URL */}
                  {ad.destination.websiteUrl && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      <span className="truncate">
                        {ad.destination.websiteUrl}
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button className="w-full mt-2" size="sm">
                    {getCtaButtonText(ad.callToAction)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Content Message */}
        {currentStep === 1 && (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Complete the steps to see your ad preview
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}