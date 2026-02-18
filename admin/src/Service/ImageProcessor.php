<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\Service;

defined('_JEXEC') or die;

use GdImage;
use Imagick;
use RuntimeException;

/**
 * Image processing service with GD/Imagick adapter
 *
 * @since  6.0.0
 */
class ImageProcessor
{
    /**
     * Available image library
     *
     * @var string
     */
    private string $library;

    /**
     * Maximum dimension for images
     *
     * @var int
     */
    private int $maxDimension = 4096;

    /**
     * Constructor - detects available image library
     *
     * @throws  RuntimeException  If no image library is available
     *
     * @since   6.0.0
     */
    public function __construct()
    {
        if (extension_loaded('gd')) {
            $this->library = 'gd';
        } elseif (extension_loaded('imagick')) {
            $this->library = 'imagick';
        } else {
            throw new RuntimeException('No image processing library available (GD or Imagick required)');
        }
    }

    /**
     * Load an image from file
     *
     * @param   string  $path  The image file path
     *
     * @return  GdImage|Imagick|null  The image resource or null on failure
     *
     * @since   6.0.0
     */
    public function loadImage(string $path): GdImage|Imagick|null
    {
        if (!file_exists($path) || !is_readable($path)) {
            return null;
        }

        try {
            if ($this->library === 'gd') {
                return $this->loadImageGD($path);
            } else {
                return $this->loadImageImagick($path);
            }
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Load image using GD library
     *
     * @param   string  $path  The image file path
     *
     * @return  GdImage|null  The GD image resource
     *
     * @since   6.0.0
     */
    private function loadImageGD(string $path): ?GdImage
    {
        $imageInfo = getimagesize($path);
        
        if ($imageInfo === false) {
            return null;
        }

        $image = match ($imageInfo[2]) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($path),
            IMAGETYPE_PNG => imagecreatefrompng($path),
            IMAGETYPE_GIF => imagecreatefromgif($path),
            IMAGETYPE_WEBP => imagecreatefromwebp($path),
            default => false
        };

        return $image !== false ? $image : null;
    }

    /**
     * Load image using Imagick library
     *
     * @param   string  $path  The image file path
     *
     * @return  Imagick|null  The Imagick object
     *
     * @since   6.0.0
     */
    private function loadImageImagick(string $path): ?Imagick
    {
        try {
            $image = new Imagick($path);
            return $image;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Save an image to file
     *
     * @param   GdImage|Imagick  $image    The image resource
     * @param   string           $path     The output file path
     * @param   int              $quality  JPEG quality (1-100)
     *
     * @return  bool  True on success
     *
     * @since   6.0.0
     */
    public function saveImage(GdImage|Imagick $image, string $path, int $quality = 90): bool
    {
        // Preserve EXIF data if possible
        $exifData = $this->extractExifData($path);

        try {
            if ($this->library === 'gd') {
                $result = $this->saveImageGD($image, $path, $quality);
            } else {
                $result = $this->saveImageImagick($image, $path, $quality);
            }

            // Restore EXIF data
            if ($result && $exifData) {
                $this->restoreExifData($path, $exifData);
            }

            return $result;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Save image using GD library
     *
     * @param   GdImage  $image    The GD image resource
     * @param   string   $path     The output file path
     * @param   int      $quality  JPEG quality
     *
     * @return  bool  True on success
     *
     * @since   6.0.0
     */
    private function saveImageGD(GdImage $image, string $path, int $quality): bool
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'jpg', 'jpeg' => imagejpeg($image, $path, $quality),
            'png' => imagepng($image, $path, (int) (9 - ($quality / 11))),
            'gif' => imagegif($image, $path),
            'webp' => imagewebp($image, $path, $quality),
            default => false
        };
    }

    /**
     * Save image using Imagick library
     *
     * @param   Imagick  $image    The Imagick object
     * @param   string   $path     The output file path
     * @param   int      $quality  JPEG quality
     *
     * @return  bool  True on success
     *
     * @since   6.0.0
     */
    private function saveImageImagick(Imagick $image, string $path, int $quality): bool
    {
        $image->setImageCompressionQuality($quality);
        return $image->writeImage($path);
    }

    /**
     * Crop an image
     *
     * @param   GdImage|Imagick  $image   The image resource
     * @param   int              $x       X coordinate
     * @param   int              $y       Y coordinate
     * @param   int              $width   Crop width
     * @param   int              $height  Crop height
     *
     * @return  GdImage|Imagick  The cropped image
     *
     * @since   6.0.0
     */
    public function crop(GdImage|Imagick $image, int $x, int $y, int $width, int $height): GdImage|Imagick
    {
        if ($this->library === 'gd') {
            return $this->cropGD($image, $x, $y, $width, $height);
        } else {
            return $this->cropImagick($image, $x, $y, $width, $height);
        }
    }

    /**
     * Crop image using GD
     *
     * @param   GdImage  $image   The GD image resource
     * @param   int      $x       X coordinate
     * @param   int      $y       Y coordinate
     * @param   int      $width   Crop width
     * @param   int      $height  Crop height
     *
     * @return  GdImage  The cropped image
     *
     * @since   6.0.0
     */
    private function cropGD(GdImage $image, int $x, int $y, int $width, int $height): GdImage
    {
        $cropped = imagecrop($image, ['x' => $x, 'y' => $y, 'width' => $width, 'height' => $height]);
        return $cropped !== false ? $cropped : $image;
    }

    /**
     * Crop image using Imagick
     *
     * @param   Imagick  $image   The Imagick object
     * @param   int      $x       X coordinate
     * @param   int      $y       Y coordinate
     * @param   int      $width   Crop width
     * @param   int      $height  Crop height
     *
     * @return  Imagick  The cropped image
     *
     * @since   6.0.0
     */
    private function cropImagick(Imagick $image, int $x, int $y, int $width, int $height): Imagick
    {
        $image->cropImage($width, $height, $x, $y);
        return $image;
    }

    /**
     * Rotate an image
     *
     * @param   GdImage|Imagick  $image  The image resource
     * @param   float            $angle  Rotation angle in degrees
     * @param   float            $scale  Scale factor
     *
     * @return  GdImage|Imagick  The rotated image
     *
     * @since   6.0.0
     */
    public function rotate(GdImage|Imagick $image, float $angle, float $scale = 1.0): GdImage|Imagick
    {
        if ($this->library === 'gd') {
            return $this->rotateGD($image, $angle, $scale);
        } else {
            return $this->rotateImagick($image, $angle, $scale);
        }
    }

    /**
     * Rotate image using GD
     *
     * @param   GdImage  $image  The GD image resource
     * @param   float    $angle  Rotation angle
     * @param   float    $scale  Scale factor
     *
     * @return  GdImage  The rotated image
     *
     * @since   6.0.0
     */
    private function rotateGD(GdImage $image, float $angle, float $scale): GdImage
    {
        $rotated = imagerotate($image, -$angle, 0);
        
        if ($rotated === false) {
            return $image;
        }

        // Apply scale if needed
        if ($scale !== 1.0) {
            $width = imagesx($rotated);
            $height = imagesy($rotated);
            $newWidth = (int) ($width * $scale);
            $newHeight = (int) ($height * $scale);
            
            $scaled = imagescale($rotated, $newWidth, $newHeight);
            imagedestroy($rotated);
            
            return $scaled !== false ? $scaled : $image;
        }

        return $rotated;
    }

    /**
     * Rotate image using Imagick
     *
     * @param   Imagick  $image  The Imagick object
     * @param   float    $angle  Rotation angle
     * @param   float    $scale  Scale factor
     *
     * @return  Imagick  The rotated image
     *
     * @since   6.0.0
     */
    private function rotateImagick(Imagick $image, float $angle, float $scale): Imagick
    {
        $image->rotateImage(new \ImagickPixel('none'), -$angle);
        
        if ($scale !== 1.0) {
            $width = $image->getImageWidth();
            $height = $image->getImageHeight();
            $image->scaleImage((int) ($width * $scale), (int) ($height * $scale));
        }

        return $image;
    }

    /**
     * Adjust image brightness
     *
     * @param   GdImage|Imagick  $image  The image resource
     * @param   int              $level  Brightness level (-255 to 255)
     *
     * @return  GdImage|Imagick  The adjusted image
     *
     * @since   6.0.0
     */
    public function adjustBrightness(GdImage|Imagick $image, int $level): GdImage|Imagick
    {
        if ($this->library === 'gd') {
            imagefilter($image, IMG_FILTER_BRIGHTNESS, $level);
        } else {
            $image->brightnessContrastImage($level, 0);
        }

        return $image;
    }

    /**
     * Adjust image contrast
     *
     * @param   GdImage|Imagick  $image  The image resource
     * @param   int              $level  Contrast level (-100 to 100)
     *
     * @return  GdImage|Imagick  The adjusted image
     *
     * @since   6.0.0
     */
    public function adjustContrast(GdImage|Imagick $image, int $level): GdImage|Imagick
    {
        if ($this->library === 'gd') {
            imagefilter($image, IMG_FILTER_CONTRAST, -$level);
        } else {
            $image->brightnessContrastImage(0, $level);
        }

        return $image;
    }

    /**
     * Apply a filter to an image
     *
     * @param   GdImage|Imagick  $image       The image resource
     * @param   string           $filterName  Filter name
     * @param   array            $params      Filter parameters
     *
     * @return  GdImage|Imagick  The filtered image
     *
     * @since   6.0.0
     */
    public function applyFilter(GdImage|Imagick $image, string $filterName, array $params = []): GdImage|Imagick
    {
        if ($this->library === 'gd') {
            return $this->applyFilterGD($image, $filterName, $params);
        } else {
            return $this->applyFilterImagick($image, $filterName, $params);
        }
    }

    /**
     * Apply filter using GD
     *
     * @param   GdImage  $image       The GD image resource
     * @param   string   $filterName  Filter name
     * @param   array    $params      Filter parameters
     *
     * @return  GdImage  The filtered image
     *
     * @since   6.0.0
     */
    private function applyFilterGD(GdImage $image, string $filterName, array $params): GdImage
    {
        match ($filterName) {
            'grayscale' => imagefilter($image, IMG_FILTER_GRAYSCALE),
            'sepia' => imagefilter($image, IMG_FILTER_GRAYSCALE) && imagefilter($image, IMG_FILTER_COLORIZE, 90, 60, 40),
            'sharpen' => imagefilter($image, IMG_FILTER_MEAN_REMOVAL),
            default => null
        };

        return $image;
    }

    /**
     * Apply filter using Imagick
     *
     * @param   Imagick  $image       The Imagick object
     * @param   string   $filterName  Filter name
     * @param   array    $params      Filter parameters
     *
     * @return  Imagick  The filtered image
     *
     * @since   6.0.0
     */
    private function applyFilterImagick(Imagick $image, string $filterName, array $params): Imagick
    {
        match ($filterName) {
            'grayscale' => $image->setImageType(Imagick::IMGTYPE_GRAYSCALE),
            'sepia' => $image->sepiaToneImage(80),
            'sharpen' => $image->sharpenImage(0, 1),
            default => null
        };

        return $image;
    }

    /**
     * Get image information
     *
     * @param   string  $path  The image file path
     *
     * @return  array  Image information
     *
     * @since   6.0.0
     */
    public function getImageInfo(string $path): array
    {
        $info = getimagesize($path);
        
        if ($info === false) {
            return [];
        }

        return [
            'width' => $info[0],
            'height' => $info[1],
            'type' => $info[2],
            'mime' => $info['mime'],
            'size' => filesize($path)
        ];
    }

    /**
     * Check if image processing is supported
     *
     * @return  bool  True if supported
     *
     * @since   6.0.0
     */
    public function isSupported(): bool
    {
        return $this->library !== '';
    }

    /**
     * Get the name of the image library being used
     *
     * @return  string  Library name (gd or imagick)
     *
     * @since   6.0.0
     */
    public function getLibraryName(): string
    {
        return $this->library;
    }

    /**
     * Extract EXIF data from image
     *
     * @param   string  $path  The image file path
     *
     * @return  array|null  EXIF data or null
     *
     * @since   6.0.0
     */
    private function extractExifData(string $path): ?array
    {
        if (!function_exists('exif_read_data')) {
            return null;
        }

        try {
            $exif = @exif_read_data($path);
            return $exif !== false ? $exif : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Restore EXIF data to image (placeholder - requires external library)
     *
     * @param   string  $path      The image file path
     * @param   array   $exifData  EXIF data to restore
     *
     * @return  void
     *
     * @since   6.0.0
     */
    private function restoreExifData(string $path, array $exifData): void
    {
        // Note: Restoring EXIF data requires external library like PEL (PHP EXIF Library)
        // This is a placeholder for future implementation
    }

    /**
     * Set maximum dimension for images
     *
     * @param   int  $dimension  Maximum dimension in pixels
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function setMaxDimension(int $dimension): void
    {
        $this->maxDimension = $dimension;
    }

    /**
     * Get maximum dimension
     *
     * @return  int  Maximum dimension in pixels
     *
     * @since   6.0.0
     */
    public function getMaxDimension(): int
    {
        return $this->maxDimension;
    }
}
