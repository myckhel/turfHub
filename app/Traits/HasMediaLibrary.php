<?php

namespace App\Traits;

use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Media Library Trait with Common Configurations
 *
 * Provides reusable media collection definitions and conversions
 * for models that need media handling capabilities.
 *
 * Usage: Add this trait to models that need media management.
 * Override registerMediaCollections() to add custom collections.
 */
trait HasMediaLibrary
{
    use InteractsWithMedia;

    /**
     * Register common media conversions for images.
     * Call this from your model's registerMediaConversions method.
     */
    public function registerCommonMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(150)
            ->height(150)
            ->sharpen(10)
            ->nonQueued() // Generate immediately for better UX
            ->performOnCollections('images', 'avatars', 'gallery');

        $this->addMediaConversion('medium')
            ->width(800)
            ->height(600)
            ->sharpen(10)
            ->performOnCollections('images', 'gallery');

        $this->addMediaConversion('large')
            ->width(1920)
            ->height(1080)
            ->sharpen(10)
            ->performOnCollections('images', 'gallery');

        $this->addMediaConversion('preview')
            ->width(400)
            ->height(300)
            ->sharpen(10)
            ->performOnCollections('images', 'gallery', 'documents');
    }

    /**
     * Register avatar collection (single file).
     */
    protected function registerAvatarCollection(): void
    {
        $this->addMediaCollection('avatars')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
            ->useFallbackUrl(asset('images/default-avatar.png'))
            ->registerMediaConversions(function (Media $media) {
                $this->addMediaConversion('thumb')
                    ->width(150)
                    ->height(150)
                    ->sharpen(10)
                    ->nonQueued();

                $this->addMediaConversion('small')
                    ->width(100)
                    ->height(100)
                    ->sharpen(10)
                    ->nonQueued();
            });
    }

    /**
     * Register images collection (multiple files).
     */
    protected function registerImagesCollection(int $maxFiles = 10): void
    {
        $this->addMediaCollection('images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'])
            ->onlyKeepLatest($maxFiles)
            ->withResponsiveImages()
            ->registerMediaConversions(function (Media $media) {
                $this->addMediaConversion('thumb')
                    ->width(150)
                    ->height(150)
                    ->sharpen(10);

                $this->addMediaConversion('medium')
                    ->width(800)
                    ->height(600)
                    ->sharpen(10);

                $this->addMediaConversion('large')
                    ->width(1920)
                    ->height(1080)
                    ->sharpen(10);
            });
    }

    /**
     * Register documents collection (multiple files).
     */
    protected function registerDocumentsCollection(int $maxFiles = 20): void
    {
        $this->addMediaCollection('documents')
            ->acceptsMimeTypes([
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
            ])
            ->onlyKeepLatest($maxFiles);
    }

    /**
     * Register gallery collection (multiple files with responsive images).
     */
    protected function registerGalleryCollection(int $maxFiles = 50): void
    {
        $this->addMediaCollection('gallery')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
            ->onlyKeepLatest($maxFiles)
            ->withResponsiveImages()
            ->registerMediaConversions(function (Media $media) {
                $this->addMediaConversion('thumb')
                    ->width(200)
                    ->height(200)
                    ->fit('crop', 200, 200)
                    ->sharpen(10);

                $this->addMediaConversion('preview')
                    ->width(400)
                    ->height(300)
                    ->sharpen(10);

                $this->addMediaConversion('large')
                    ->width(1920)
                    ->height(1080)
                    ->sharpen(10);
            });
    }

    /**
     * Register videos collection.
     */
    protected function registerVideosCollection(int $maxFiles = 5): void
    {
        $this->addMediaCollection('videos')
            ->acceptsMimeTypes([
                'video/mp4',
                'video/mpeg',
                'video/quicktime',
                'video/x-msvideo',
                'video/webm',
            ])
            ->onlyKeepLatest($maxFiles);
    }

    /**
     * Helper method to get the first media URL with fallback.
     */
    public function getMediaUrl(string $collection = 'images', string $conversion = ''): ?string
    {
        return $this->getFirstMediaUrl($collection, $conversion) ?: null;
    }

    /**
     * Helper method to check if a collection has media.
     */
    public function hasMediaInCollection(string $collection): bool
    {
        return $this->getMedia($collection)->isNotEmpty();
    }

    /**
     * Helper method to get all media URLs from a collection.
     */
    public function getMediaUrls(string $collection = 'images', string $conversion = ''): array
    {
        return $this->getMedia($collection)
            ->map(fn($media) => $media->getUrl($conversion))
            ->toArray();
    }

    /**
     * Helper method to add media from request with validation.
     */
    public function addMediaFromRequestWithValidation(
        string $key,
        string $collection = 'images',
        string $disk = 'media'
    ): ?Media {
        if (!request()->hasFile($key)) {
            return null;
        }

        return $this->addMediaFromRequest($key)
            ->toMediaCollection($collection, $disk);
    }
}
