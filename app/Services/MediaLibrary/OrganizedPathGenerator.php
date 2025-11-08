<?php

namespace App\Services\MediaLibrary;

use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

/**
 * Organized Path Generator for Media Library
 *
 * Creates a well-organized directory structure:
 * - Groups by model type (e.g., users, turfs, matches)
 * - Separates by collection name
 * - Uses model ID for uniqueness
 * - Keeps conversions and responsive images organized
 *
 * Structure: {model_type}/{model_id}/{collection_name}/
 * Example: users/123/avatars/profile.jpg
 *          users/123/avatars/conversions/profile-thumb.jpg
 */
class OrganizedPathGenerator implements PathGenerator
{
    /**
     * Get the path for the given media, relative to the root storage path.
     */
    public function getPath(Media $media): string
    {
        return $this->getBasePath($media) . '/';
    }

    /**
     * Get the path for conversions of the given media, relative to the root storage path.
     */
    public function getPathForConversions(Media $media): string
    {
        return $this->getBasePath($media) . '/conversions/';
    }

    /**
     * Get the path for responsive images of the given media, relative to the root storage path.
     */
    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->getBasePath($media) . '/responsive/';
    }

    /**
     * Get the base path structure.
     */
    protected function getBasePath(Media $media): string
    {
        $modelType = $this->getModelType($media);
        $modelId = $media->model_id;
        $collectionName = $media->collection_name;

        return "{$modelType}/{$modelId}/{$collectionName}";
    }

    /**
     * Get a human-readable model type from the model class.
     */
    protected function getModelType(Media $media): string
    {
        $modelClass = $media->model_type;

        // Extract the class name from the fully qualified class name
        $className = class_basename($modelClass);

        // Convert to snake_case and pluralize
        $snakeCase = strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $className));

        return str($snakeCase)->plural()->value();
    }
}
