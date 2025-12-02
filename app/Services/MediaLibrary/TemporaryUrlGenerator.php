<?php

namespace App\Services\MediaLibrary;

use DateTimeInterface;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\Support\UrlGenerator\DefaultUrlGenerator;

/**
 * Custom URL Generator for Media Library
 *
 * This generator intelligently determines whether to use:
 * - Direct public URLs for local/public storage
 * - Temporary signed URLs for private S3/R2 buckets
 *
 * This ensures media works correctly in both development (local)
 * and production (Laravel Cloud with private R2 buckets).
 */
class TemporaryUrlGenerator extends DefaultUrlGenerator
{
    /**
     * Get the URL for the media item.
     */
    public function getUrl(): string
    {
        // If the disk supports temporary URLs and is private, use them
        if ($this->shouldUseTemporaryUrl()) {
            return $this->getTemporaryUrl(
                now()->addMinutes($this->getTemporaryUrlLifetime())
            );
        }

        // Otherwise, use the default public URL generation
        return parent::getUrl();
    }

    /**
     * Determine if temporary URLs should be used.
     */
    protected function shouldUseTemporaryUrl(): bool
    {
        $disk = Storage::disk($this->media->disk);

        // Check if the disk supports temporary URLs (S3, R2, etc.)
        if (!method_exists($disk, 'temporaryUrl')) {
            return false;
        }

        // Check if the media's visibility is private or if the disk is configured as private
        $visibility = $this->media->getCustomProperty('visibility', $this->getDiskVisibility());

        return $visibility === 'private';
    }

    /**
     * Get the disk's default visibility setting.
     */
    protected function getDiskVisibility(): string
    {
        $diskConfig = config("filesystems.disks.{$this->media->disk}");

        return $diskConfig['visibility'] ?? 'public';
    }

    /**
     * Get the temporary URL lifetime in minutes.
     */
    protected function getTemporaryUrlLifetime(): int
    {
        return (int) config('media-library.temporary_url_default_lifetime', 60);
    }

    /**
     * Get a temporary URL for the media item.
     */
    public function getTemporaryUrl(DateTimeInterface $expiration, array $options = []): string
    {
        try {
            $disk = Storage::disk($this->media->disk);

            if (!method_exists($disk, 'temporaryUrl')) {
                // Fallback to regular URL if temporary URLs are not supported
                return parent::getUrl();
            }

            /** @var \Illuminate\Filesystem\AwsS3V3Adapter $disk */
            return $disk->temporaryUrl(
                $this->getPathRelativeToRoot(),
                $expiration,
                $options
            );
        } catch (\Exception $e) {
            // Log the error and fallback to default URL
            logger()->error('Failed to generate temporary URL for media', [
                'media_id' => $this->media->id,
                'disk' => $this->media->disk,
                'error' => $e->getMessage(),
            ]);

            return parent::getUrl();
        }
    }

    /**
     * Get the responsive images URLs.
     */
    public function getResponsiveImagesDirectoryUrl(): string
    {
        if ($this->shouldUseTemporaryUrl()) {
            // For private buckets, responsive images also need temporary URLs
            // The ResponsiveImage model will handle individual URLs
            return parent::getResponsiveImagesDirectoryUrl();
        }

        return parent::getResponsiveImagesDirectoryUrl();
    }
}
