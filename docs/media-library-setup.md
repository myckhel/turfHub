# Laravel Media Library Setup Guide

## 📦 Installation Complete

Laravel Media Library v11 has been successfully installed with modern best practices for flexible and efficient media management.

## 🎯 Key Features

### 1. **Organized Directory Structure**
Files are automatically organized by:
- Model type (e.g., `users`, `turfs`, `matches`)
- Model ID for uniqueness
- Collection name for categorization

**Example Structure:**
```
storage/app/public/media/
├── users/
│   ├── 1/
│   │   ├── avatars/
│   │   │   ├── profile.jpg
│   │   │   ├── conversions/
│   │   │   │   ├── profile-thumb.jpg
│   │   │   │   └── profile-small.jpg
│   │   │   └── responsive/
│   │   └── documents/
│   └── 2/
├── turfs/
│   ├── 5/
│   │   ├── images/
│   │   │   ├── field.jpg
│   │   │   └── conversions/
│   │   └── gallery/
└── matches/
```

### 2. **Reusable Trait with Common Collections**
The `HasMediaLibrary` trait provides ready-to-use media collections:
- **Avatars** (single file, auto-fallback)
- **Images** (multiple files, responsive)
- **Documents** (PDFs, Word, Excel, etc.)
- **Gallery** (optimized for image galleries)
- **Videos** (MP4, WebM, etc.)

### 3. **Automatic Image Optimization**
- Conversions: thumb, medium, large, preview
- Responsive images support
- Queue-based processing
- Smart compression

### 4. **Flexible Configuration**
- Custom path generator
- Organized media disk
- Environment-based settings
- Easy to extend

## 🚀 Quick Start

### Step 1: Add Trait to Your Model

```php
<?php

namespace App\Models;

use App\Traits\HasMediaLibrary;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;

class User extends Model implements HasMedia
{
    use HasMediaLibrary;

    /**
     * Register media collections for this model.
     */
    public function registerMediaCollections(): void
    {
        // Register single avatar with fallback
        $this->registerAvatarCollection();
        
        // Register multiple images (max 10)
        $this->registerImagesCollection(10);
        
        // Register documents
        $this->registerDocumentsCollection(20);
    }

    /**
     * Register media conversions.
     */
    public function registerMediaConversions(Media $media = null): void
    {
        $this->registerCommonMediaConversions($media);
    }
}
```

### Step 2: Upload Media

```php
// From a file path
$user->addMedia($pathToFile)
    ->toMediaCollection('avatars');

// From request
$user->addMediaFromRequest('avatar')
    ->toMediaCollection('avatars');

// With helper method
$user->addMediaFromRequestWithValidation('avatar', 'avatars');

// To a specific disk
$user->addMedia($file)
    ->toMediaCollection('images', 's3');
```

### Step 3: Retrieve Media

```php
// Get first media URL
$avatarUrl = $user->getFirstMediaUrl('avatars');
$thumbUrl = $user->getFirstMediaUrl('avatars', 'thumb');

// Using helper methods
$url = $user->getMediaUrl('avatars', 'thumb');
$allUrls = $user->getMediaUrls('images');

// Check if has media
if ($user->hasMediaInCollection('avatars')) {
    // Has avatar
}

// Get all media from collection
$images = $user->getMedia('images');

// Get media with conversion
foreach ($user->getMedia('gallery') as $media) {
    echo $media->getUrl('large');
    echo $media->getUrl('thumb');
}
```

## 📝 Available Collections

### Avatar Collection
```php
$this->registerAvatarCollection();
```
- **Type:** Single file
- **Formats:** JPEG, PNG, WebP
- **Conversions:** thumb (150x150), small (100x100)
- **Features:** Auto-fallback to default avatar

### Images Collection
```php
$this->registerImagesCollection($maxFiles = 10);
```
- **Type:** Multiple files
- **Formats:** JPEG, PNG, WebP, GIF
- **Conversions:** thumb (150x150), medium (800x600), large (1920x1080)
- **Features:** Responsive images, auto-limit

### Documents Collection
```php
$this->registerDocumentsCollection($maxFiles = 20);
```
- **Type:** Multiple files
- **Formats:** PDF, Word, Excel, Text
- **Features:** Auto-limit old files

### Gallery Collection
```php
$this->registerGalleryCollection($maxFiles = 50);
```
- **Type:** Multiple files (optimized for galleries)
- **Formats:** JPEG, PNG, WebP
- **Conversions:** thumb (200x200 crop), preview (400x300), large (1920x1080)
- **Features:** Responsive images, optimized for display

### Videos Collection
```php
$this->registerVideosCollection($maxFiles = 5);
```
- **Type:** Multiple files
- **Formats:** MP4, MPEG, QuickTime, AVI, WebM

## 🎨 Image Conversions

### Common Conversions (Available on most collections)

```php
// Thumbnail - Square crop
$media->getUrl('thumb') // 150x150 or 200x200

// Medium - Landscape
$media->getUrl('medium') // 800x600

// Large - Full HD
$media->getUrl('large') // 1920x1080

// Preview - Card size
$media->getUrl('preview') // 400x300
```

### Custom Conversions

```php
public function registerMediaConversions(Media $media = null): void
{
    $this->addMediaConversion('custom')
        ->width(500)
        ->height(500)
        ->sharpen(10)
        ->quality(90)
        ->nonQueued() // Generate immediately
        ->performOnCollections('images');
}
```

## 🔧 Advanced Usage

### Custom Collection with Validations

```php
public function registerMediaCollections(): void
{
    $this->addMediaCollection('custom')
        ->acceptsMimeTypes(['image/jpeg', 'image/png'])
        ->singleFile()
        ->useDisk('s3')
        ->registerMediaConversions(function (Media $media) {
            $this->addMediaConversion('thumbnail')
                ->width(300)
                ->height(300);
        });
}
```

**Note:** File size validation should be done in your Form Request or controller validation rules, not in the media collection registration:

```php
// In your Form Request or Controller
$request->validate([
    'custom_file' => 'required|file|mimes:jpeg,png|max:5120', // 5MB max (in KB)
]);
```

### Using Different Disks

```php
// Use S3 for large files
$turf->addMedia($video)
    ->toMediaCollection('videos', 's3');

// Use local media disk (default)
$user->addMedia($image)
    ->toMediaCollection('avatars', 'media');
```

### Responsive Images

```php
// Enable responsive images on collection
$this->addMediaCollection('hero')
    ->withResponsiveImages();

// Render in view
{{ $media->img()->attributes(['class' => 'img-fluid']) }}
```

### Custom Properties

```php
// Add custom properties
$user->addMedia($file)
    ->withCustomProperties(['title' => 'Profile Picture', 'featured' => true])
    ->toMediaCollection('images');

// Retrieve custom properties
$media->getCustomProperty('title');
$media->getCustomProperty('featured');
```

## 🌐 API Resource Integration

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => [
                'original' => $this->getFirstMediaUrl('avatars'),
                'thumb' => $this->getFirstMediaUrl('avatars', 'thumb'),
                'small' => $this->getFirstMediaUrl('avatars', 'small'),
            ],
            'images' => $this->getMedia('images')->map(fn($media) => [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'thumb' => $media->getUrl('thumb'),
                'name' => $media->file_name,
                'size' => $media->size,
            ]),
        ];
    }
}
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Media Library
MEDIA_DISK=media
MEDIA_MAX_FILE_SIZE=26214400
MEDIA_QUEUE=
QUEUE_CONVERSIONS_BY_DEFAULT=true
QUEUE_CONVERSIONS_AFTER_DB_COMMIT=true
IMAGE_DRIVER=gd
```

### Filesystem Configuration

The `media` disk is configured in `config/filesystems.php`:
```php
'media' => [
    'driver' => 'local',
    'root' => storage_path('app/public/media'),
    'url' => env('APP_URL').'/storage/media',
    'visibility' => 'public',
],
```

## 📦 File Organization

The custom `OrganizedPathGenerator` creates this structure:
```
{model_type}/{model_id}/{collection_name}/
```

Examples:
- `users/123/avatars/profile.jpg`
- `users/123/avatars/conversions/profile-thumb.jpg`
- `turfs/5/images/field.jpg`
- `matches/10/documents/contract.pdf`

## 🔐 Security Best Practices

1. **Validate file types** using `acceptsMimeTypes()`
2. **Limit file sizes** with `max_file_size` config
3. **Use single file collections** for avatars/profiles
4. **Limit collection sizes** with `onlyKeepLatest()`
5. **Store sensitive files** on private disks
6. **Validate uploads** in Form Requests

## 🎯 Performance Tips

1. **Queue conversions** for better performance (enabled by default)
2. **Use `nonQueued()`** only for critical thumbnails
3. **Enable responsive images** for galleries
4. **Optimize images** with built-in optimizers
5. **Use CDN** for public media (configure URL generator)

## 📚 Resources

- [Official Documentation](https://spatie.be/docs/laravel-medialibrary/v11/introduction)
- [Video Course](https://spatie.be/courses/discovering-laravel-media-library)
- [GitHub Repository](https://github.com/spatie/laravel-medialibrary)

## 🔄 Common Operations

### Delete Media
```php
$media = $user->getFirstMedia('avatars');
$media->delete();

// Delete all media in collection
$user->clearMediaCollection('images');
```

### Update Media
```php
// Replace existing (single file collection)
$user->addMedia($newFile)
    ->toMediaCollection('avatars'); // Automatically replaces old one

// Add to collection (multiple files)
$user->addMedia($file)
    ->toMediaCollection('images');
```

### Move Media
```php
$media->move($otherModel, 'collection-name');
```

### Download Media
```php
return response()->download($media->getPath(), $media->file_name);
```

## 🧪 Testing Example

```php
public function test_user_can_upload_avatar(): void
{
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('avatar.jpg', 150, 150);

    $user->addMedia($file)->toMediaCollection('avatars');

    $this->assertTrue($user->hasMediaInCollection('avatars'));
    $this->assertNotNull($user->getFirstMediaUrl('avatars'));
}
```

---

**Setup Complete!** 🎉

Your Laravel Media Library is now configured with:
✅ Organized directory structure
✅ Reusable trait with common collections
✅ Automatic image optimization
✅ Queue-based processing
✅ Responsive images support
✅ Flexible configuration
