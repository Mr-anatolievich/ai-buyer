import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadCloud, Image as ImageIcon, Video, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { CallToAction } from '@/store/useAppStore';

const CTA_OPTIONS: { value: CallToAction; label: string }[] = [
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'SHOP_NOW', label: 'Shop Now' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'CONTACT_US', label: 'Contact Us' },
  { value: 'DOWNLOAD', label: 'Download' },
];

export function AdStep() {
  const { draft, updateAdDraft, validateStep } = useAppStore();
  const { ad } = draft;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid = validateStep(3);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateAdDraft({
        creative: { ...ad.creative, media: file }
      });
    }
  };

  const removeMedia = () => {
    updateAdDraft({
      creative: { ...ad.creative, media: undefined }
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleCtaChange = (value: CallToAction) => {
    updateAdDraft({ callToAction: value });
  };

  return (
    <div className="space-y-6">
      {/* Creative Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Creative</h3>
          <p className="text-sm text-muted-foreground">Upload your ad creative and write compelling copy</p>
        </div>

        {/* Media Upload */}
        <div className="space-y-2">
          <Label>Media (Image or Video)</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            {ad.creative.media ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {ad.creative.media instanceof File ? (
                    <>
                      {ad.creative.media.type.startsWith('video/') ? (
                        <Video className="w-8 h-8 text-primary" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{ad.creative.media.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(ad.creative.media.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-primary" />
                      <p className="font-medium">Media uploaded</p>
                    </>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={removeMedia}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Upload your creative</p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop or click to upload images (JPG, PNG) or videos (MP4, MOV)
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    Choose File
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Primary Text */}
        <div className="space-y-2">
          <Label htmlFor="primary-text">Primary Text *</Label>
          <Textarea
            id="primary-text"
            value={ad.creative.primaryText}
            onChange={(e) => updateAdDraft({
              creative: { ...ad.creative, primaryText: e.target.value }
            })}
            placeholder="Tell people what your ad is about. This text appears above your creative in most placements."
            rows={4}
            className={!ad.creative.primaryText.trim() && !isValid ? 'border-destructive' : ''}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{ad.creative.primaryText.length}/2200 characters</span>
            {!ad.creative.primaryText.trim() && !isValid && (
              <span className="text-destructive">Primary text is required</span>
            )}
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline">Headline *</Label>
          <Input
            id="headline"
            value={ad.creative.headline}
            onChange={(e) => updateAdDraft({
              creative: { ...ad.creative, headline: e.target.value }
            })}
            placeholder="A short, catchy headline that describes your offering"
            className={!ad.creative.headline.trim() && !isValid ? 'border-destructive' : ''}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{ad.creative.headline.length}/40 characters</span>
            {!ad.creative.headline.trim() && !isValid && (
              <span className="text-destructive">Headline is required</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={ad.creative.description}
            onChange={(e) => updateAdDraft({
              creative: { ...ad.creative, description: e.target.value }
            })}
            placeholder="Additional description text (appears below headline)"
          />
          <div className="text-xs text-muted-foreground text-right">
            {ad.creative.description.length}/30 characters
          </div>
        </div>
      </div>

      <Separator />

      {/* Destination Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Destination</h3>
          <p className="text-sm text-muted-foreground">Where people will go when they click your ad</p>
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="website-url">Website URL *</Label>
          <Input
            id="website-url"
            type="url"
            value={ad.destination.websiteUrl}
            onChange={(e) => updateAdDraft({
              destination: { ...ad.destination, websiteUrl: e.target.value }
            })}
            placeholder="https://example.com/product"
            className={(!ad.destination.websiteUrl.trim() || 
              !isValidUrl(ad.destination.websiteUrl)) && !isValid ? 'border-destructive' : ''}
          />
          {(!ad.destination.websiteUrl.trim() || 
            !isValidUrl(ad.destination.websiteUrl)) && !isValid && (
            <p className="text-sm text-destructive">
              Please enter a valid website URL
            </p>
          )}
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label>Call to Action Button</Label>
          <Select value={ad.callToAction} onValueChange={handleCtaChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tracking & Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracking & Optimization</CardTitle>
          <CardDescription>
            Configure conversion tracking and optimization settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <strong>Automatic tracking</strong> will be enabled for this ad. 
              Standard web events (page views, purchases, etc.) will be tracked automatically.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preview Notice */}
      <Alert>
        <AlertDescription>
          Your ad preview is shown on the right. Make sure your creative and copy work well together 
          before proceeding to the final step.
        </AlertDescription>
      </Alert>
    </div>
  );
}