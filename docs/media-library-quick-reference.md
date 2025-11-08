# 📸 Media Library Quick Reference

## 🎯 Most Common Operations

### Upload Single File
```php
$model->addMediaFromRequest('file')
    ->toMediaCollection('images');
```

### Upload to Specific Collection
```php
$model->addMediaFromRequestWithValidation('avatar', 'avatars');
```

### Get Media URL
```php
// Original
$model->getFirstMediaUrl('images');

// With conversion
$model->getFirstMediaUrl('images', 'thumb');
```

### Check if Has Media
```php
if ($model->hasMediaInCollection('images')) {
    // Has images
}
```

### Get All Media URLs
```php
$urls = $model->getMediaUrls('images', 'thumb');
```

### Delete Media
```php
$model->clearMediaCollection('images');
// or
$media->delete();
```

## 🎨 Available Conversions

| Name    | Size              | Best For             |
| ------- | ----------------- | -------------------- |
| thumb   | 150x150 / 200x200 | Lists, grids         |
| small   | 100x100           | Icons, tiny previews |
| medium  | 800x600           | Cards, previews      |
| large   | 1920x1080         | Full view            |
| preview | 400x300           | Thumbnails           |

## 📦 Collection Types

### Avatar (Single File)
```php
$this->registerAvatarCollection();
```

### Images (Multiple)
```php
$this->registerImagesCollection(10); // max 10
```

### Gallery
```php
$this->registerGalleryCollection(50); // max 50
```

### Documents
```php
$this->registerDocumentsCollection(20);
```

### Videos
```php
$this->registerVideosCollection(5);
```

## 🔧 Custom Collection

```php
public function registerMediaCollections(): void
{
    $this->addMediaCollection('custom')
        ->singleFile() // or omit for multiple
        ->acceptsMimeTypes(['image/jpeg', 'image/png'])
        ->onlyKeepLatest(10)
        ->useDisk('s3')
        ->withResponsiveImages()
        ->registerMediaConversions(function (Media $media) {
            $this->addMediaConversion('custom-thumb')
                ->width(300)
                ->height(300)
                ->sharpen(10);
        });
}
```

## 📱 API Response Format

```php
// In Resource
return [
    'avatar' => [
        'original' => $this->getFirstMediaUrl('avatars'),
        'thumb' => $this->getFirstMediaUrl('avatars', 'thumb'),
    ],
    'images' => $this->getMedia('images')->map(fn($m) => [
        'id' => $m->id,
        'url' => $m->getUrl(),
        'thumb' => $m->getUrl('thumb'),
    ]),
];
```

## 🎯 Model Setup Template

```php
use App\Traits\HasMediaLibrary;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class YourModel extends Model implements HasMedia
{
    use HasMediaLibrary;

    public function registerMediaCollections(): void
    {
        $this->registerAvatarCollection();
        $this->registerImagesCollection(10);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->registerCommonMediaConversions($media);
    }
}
```

## 🚀 Controller Template

```php
public function uploadImage(Request $request, Model $model)
{
    $request->validate([
        'image' => 'required|image|max:10240',
    ]);

    $media = $model->addMediaFromRequest('image')
        ->toMediaCollection('images');

    return response()->json([
        'id' => $media->id,
        'url' => $media->getUrl(),
        'thumb' => $media->getUrl('thumb'),
    ]);
}
```

## 🔐 Validation Rules

```php
// Single image
'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240'

// Multiple images
'images' => 'required|array|max:10',
'images.*' => 'required|image|max:10240',

// Document
'document' => 'required|file|mimes:pdf,doc,docx|max:25600'

// Video
'video' => 'required|mimes:mp4,mov,avi,webm|max:102400'
```

## 🗂️ File Organization

```
storage/app/public/media/
└── {model_type}/
    └── {model_id}/
        └── {collection}/
            ├── file.jpg
            ├── conversions/
            │   ├── file-thumb.jpg
            │   └── file-medium.jpg
            └── responsive/
```

## 🛠️ Helper Methods

```php
// Check collection
$model->hasMediaInCollection('images')

// Get URL with fallback
$model->getMediaUrl('images', 'thumb')

// Get all URLs
$model->getMediaUrls('images', 'thumb')

// Add with validation
$model->addMediaFromRequestWithValidation('file', 'images')
```

## ⚙️ Environment Variables

```env
MEDIA_DISK=media
MEDIA_MAX_FILE_SIZE=26214400
QUEUE_CONVERSIONS_BY_DEFAULT=true
IMAGE_DRIVER=gd
```

## 📚 Resources

- Full Docs: `docs/media-library-setup.md`
- Example: `app/Models/TurfExample.php`
- Controller: `app/Http/Controllers/Api/Examples/MediaExampleController.php`
- Official: https://spatie.be/docs/laravel-medialibrary/v11
