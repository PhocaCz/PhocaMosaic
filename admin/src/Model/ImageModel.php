<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\Model;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Model\BaseModel;
use Joomla\Filesystem\Folder;
use Phoca\Component\PhocaMosaic\Administrator\Service\ImageProcessor;
use Phoca\Component\PhocaMosaic\Administrator\Service\PathSanitizer;

/**
 * Image model for file operations and processing
 *
 * @since  6.0.0
 */
class ImageModel extends BaseModel
{
    /**
     * Path sanitizer service
     *
     * @var PathSanitizer
     */
    private PathSanitizer $pathSanitizer;

    /**
     * Image processor service
     *
     * @var ImageProcessor
     */
    private ImageProcessor $imageProcessor;

    /**
     * Constructor
     *
     * @since  6.0.0
     */
    public function __construct()
    {
        parent::__construct();
        
        // Create services directly instead of using DI container
        $this->pathSanitizer = new PathSanitizer();
        $this->imageProcessor = new ImageProcessor();
    }

    /**
     * Get image quality from component configuration
     *
     * @return  int  Quality value (1-100)
     *
     * @since   6.0.0
     */
    private function getImageQuality(): int
    {
        $params = \Joomla\CMS\Component\ComponentHelper::getParams('com_phocamosaic');
        return (int) $params->get('image_quality', 90);
    }

    /**
     * Get image data
     *
     * @param   string  $relativePath  Relative path from images directory
     *
     * @return  array|null  Image data or null on failure
     *
     * @since   6.0.0
     */
    public function getImage(string $relativePath): ?array
    {
        try {
            $absolutePath = $this->pathSanitizer->sanitizePath($relativePath);
            
            if (!file_exists($absolutePath)) {
                return null;
            }

            $info = $this->imageProcessor->getImageInfo($absolutePath);
            
            if (empty($info)) {
                return null;
            }

            return [
                'relativePath' => $relativePath,
                'absolutePath' => $absolutePath,
                'filename' => basename($absolutePath),
                'width' => $info['width'],
                'height' => $info['height'],
                'size' => $info['size'],
                'mime' => $info['mime'],
                'modified' => filemtime($absolutePath)
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Validate path
     *
     * @param   string  $path  Path to validate
     *
     * @return  bool  True if valid
     *
     * @since   6.0.0
     */
    public function validatePath(string $path): bool
    {
        try {
            $this->pathSanitizer->sanitizePath($path);
            return $this->pathSanitizer->isSafePath($path);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get supported image formats
     *
     * @return  array  Array of supported extensions
     *
     * @since   6.0.0
     */
    public function getSupportedFormats(): array
    {
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    }

    /**
     * Generate preview for large images
     *
     * @param   string  $relativePath   Relative path from images directory
     * @param   int     $maxDimension   Maximum dimension for preview
     *
     * @return  string|null  Preview image path or null on failure
     *
     * @since   6.0.0
     */
    public function generatePreview(string $relativePath, int $maxDimension = 2048): ?string
    {
        try {
            $absolutePath = $this->pathSanitizer->sanitizePath($relativePath);
            $info = $this->imageProcessor->getImageInfo($absolutePath);
            
            // Check if preview is needed
            if ($info['width'] <= $maxDimension && $info['height'] <= $maxDimension) {
                return $absolutePath;
            }

            // Generate preview path
            $previewDir = dirname($absolutePath) . '/.mosaic_previews';
            
            if (!is_dir($previewDir)) {
                //mkdir($previewDir, 0755, true);
                if (!Folder::create($previewDir)) {
                    //throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_CREATE_FOLDER_FAILED'));
                    return null;
                }
                $indexFile = $previewDir . '/index.html';
                if (!file_exists($indexFile)) {
                    file_put_contents($indexFile, '<!DOCTYPE html><title></title>');
                }
            }

            $previewPath = $previewDir . '/' . basename($absolutePath);

            // Check if preview already exists and is up to date
            if (file_exists($previewPath) && filemtime($previewPath) >= filemtime($absolutePath)) {
                return $previewPath;
            }

            // Load and resize image
            $image = $this->imageProcessor->loadImage($absolutePath);
            
            if ($image === null) {
                return null;
            }

            // Calculate new dimensions
            $ratio = min($maxDimension / $info['width'], $maxDimension / $info['height']);
            $newWidth = (int) ($info['width'] * $ratio);
            $newHeight = (int) ($info['height'] * $ratio);

            // Resize using GD or Imagick
            if ($image instanceof \GdImage) {
                $preview = imagescale($image, $newWidth, $newHeight);
                imagedestroy($image);
                $image = $preview;
            } else {
                $image->scaleImage($newWidth, $newHeight);
            }

            // Save preview
            $this->imageProcessor->saveImage($image, $previewPath, $this->getImageQuality());

            return $previewPath;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Save edited image
     *
     * @param   string  $relativePath    Relative path from images directory
     * @param   string  $uploadedFile    Path to uploaded temporary file
     *
     * @return  bool  True on success
     *
     * @since   6.0.0
     */
    public function saveEditedImage(string $relativePath, string $uploadedFile): bool
    {

       try {
            $absolutePath = $this->pathSanitizer->sanitizePath($relativePath);
            
            // Validate uploaded file
            if (!file_exists($uploadedFile)) {
                throw new \Exception('Uploaded file not found');
            }
      
            // Create backup first
            $backupModel = new BackupModel();
            $backupModel->createBackup($absolutePath);

            // Move uploaded file to destination
            if (!move_uploaded_file($uploadedFile, $absolutePath)) {
                // If move fails, try copy
               /* if (!copy($uploadedFile, $absolutePath)) {
                    throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FAILED_TO_SAVE'));
                }*/
                //@unlink($uploadedFile);
                throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FAILED_TO_SAVE'));
                //@unlink($uploadedFile);
            }
    

            // Set proper permissions
            chmod($absolutePath, 0644);

            return true;
        } catch (\Exception $e) {
            // Don't enqueue Joomla message - let AJAX handle it
            return false;
        }
    }

    /**
     * Apply single operation to image
     *
     * @param   \GdImage|\Imagick  $image      Image resource
     * @param   array              $operation  Operation data
     *
     * @return  \GdImage|\Imagick  Modified image
     *
     * @since   6.0.0
     */
    private function applyOperation($image, array $operation)
    {
        $type = $operation['type'] ?? '';
        $params = $operation['parameters'] ?? [];

        return match ($type) {
            'crop' => $this->imageProcessor->crop(
                $image,
                $params['x'] ?? 0,
                $params['y'] ?? 0,
                $params['width'] ?? 0,
                $params['height'] ?? 0
            ),
            'rotate' => $this->imageProcessor->rotate(
                $image,
                $params['angle'] ?? 0,
                $params['scale'] ?? 1.0
            ),
            'brightness' => $this->imageProcessor->adjustBrightness(
                $image,
                $params['level'] ?? 0
            ),
            'contrast' => $this->imageProcessor->adjustContrast(
                $image,
                $params['level'] ?? 0
            ),
            'filter' => $this->imageProcessor->applyFilter(
                $image,
                $params['name'] ?? '',
                $params
            ),
            default => $image
        };
    }
}
