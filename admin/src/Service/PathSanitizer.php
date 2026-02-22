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


use Joomla\Filesystem\Path;
use InvalidArgumentException;

/**
 * Path sanitization service for secure file system operations
 *
 * @since  6.0.0
 */
class PathSanitizer
{
    /**
     * Base images directory
     *
     * @var string
     */
    private string $baseImagesPath;

    /**
     * Constructor
     *
     * @since  6.0.0
     */
    public function __construct()
    {
        $this->baseImagesPath = JPATH_ROOT . '/images';
    }

    /**
     * Sanitize and validate a user-provided path
     *
     * @param   string  $path  The path to sanitize
     *
     * @return  string  The sanitized absolute path
     *
     * @throws  InvalidArgumentException  If path is invalid or outside allowed directory
     *
     * @since   6.0.0
     */
    public function sanitizePath(string $path): string
    {
        
        // Remove any null bytes
        $path = str_replace("\0", '', $path);
        
        // Clean the path using Joomla's Path utility
        $cleanPath = Path::clean($path);
        
        // Remove leading slash if present to make it relative
        $cleanPath = ltrim($cleanPath, '/\\');
        
        // Always make path relative to JPATH_ROOT
        $absolutePath = JPATH_ROOT . '/' . $cleanPath;
        // Resolve the real path to prevent directory traversal
        $realPath = realpath($absolutePath);
        
        // If realpath returns false, the path doesn't exist yet - validate the parent
        if ($realPath === false) {
            $parentDir = dirname($absolutePath);
            $realParent = realpath($parentDir);
            if ($realParent === false || !$this->isWithinImagesDirectory($realParent)) {
                throw new InvalidArgumentException('Invalid path: parent directory does not exist or is outside images directory');
            }
            
            // Return the cleaned path for new files
            return $absolutePath;
        }
        
        // Verify the path is within the images directory
        if (!$this->isWithinImagesDirectory($realPath)) {
            throw new InvalidArgumentException('Path is outside the allowed images directory');
        }
        
        return $realPath;
    }

    /**
     * Check if a path is absolute
     *
     * @param   string  $path  The path to check
     *
     * @return  bool  True if path is absolute
     *
     * @since   6.0.0
     */
    private function isAbsolutePath(string $path): bool
    {
        // Unix absolute path starts with /
        if (substr($path, 0, 1) === '/') {
            return true;
        }
        
        // Windows absolute path (C:\ or C:/)
        if (preg_match('/^[a-zA-Z]:[\/\\\\]/', $path)) {
            return true;
        }
        
        return false;
    }

    /**
     * Validate that a path is within the images directory
     *
     * @param   string  $path  The path to validate
     *
     * @return  bool  True if path is within images directory
     *
     * @since   6.0.0
     */
    /*public function isWithinImagesDirectory(string $path): bool
    {
        $realBasePath = realpath($this->baseImagesPath);
        
        if ($realBasePath === false) {
            return false;
        }
        
        // Normalize paths for comparison
        $normalizedPath = Path::clean($path);
        $normalizedBase = Path::clean($realBasePath);
        
        // Check if path starts with base path
        return strpos($normalizedPath, $normalizedBase) === 0;
    }*/
    public function isWithinImagesDirectory(string $path): bool
    {
        $realBasePath = realpath($this->baseImagesPath);

        if ($realBasePath === false) {
            return false;
        }

        $normalizedPath = Path::clean($path);
        $normalizedBase = Path::clean($realBasePath);

        // Ensure separator boundary so /images-extra does not match /images
        return str_starts_with($normalizedPath, $normalizedBase . DIRECTORY_SEPARATOR)
            || $normalizedPath === $normalizedBase;
    }

    /**
     * Convert absolute path to relative path from JPATH_ROOT
     *
     * @param   string  $absolutePath  The absolute path
     *
     * @return  string  The relative path from JPATH_ROOT
     *
     * @since   6.0.0
     */
    public function getRelativePath(string $absolutePath): string
    {
        $realRoot = realpath(JPATH_ROOT);
        $cleanPath = Path::clean($absolutePath);
        
        if ($realRoot && strpos($cleanPath, $realRoot) === 0) {
            return ltrim(substr($cleanPath, strlen($realRoot)), '/\\');
        }
        
        return $cleanPath;
    }

    /**
     * Get the base images directory path
     *
     * @return  string  The base images directory
     *
     * @since   6.0.0
     */
    public function getBaseImagesPath(): string
    {
        return $this->baseImagesPath;
    }

    /**
     * Validate file extension is allowed for images
     *
     * @param   string  $filename  The filename to check
     *
     * @return  bool  True if extension is allowed
     *
     * @since   6.0.0
     */
    public function isAllowedImageExtension(string $filename): bool
    {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        return in_array($extension, $allowedExtensions, true);
    }

    /**
     * Prevent path traversal attacks by checking for suspicious patterns
     *
     * @param   string  $path  The path to check
     *
     * @return  bool  True if path appears safe
     *
     * @since   6.0.0
     */
    public function isSafePath(string $path): bool
    {
        // Check for path traversal patterns
        $dangerousPatterns = [
            '../',
            '..\\',
            '%2e%2e/',
            '%2e%2e\\',
            '..%2f',
            '..%5c',
        ];
        
        $lowerPath = strtolower($path);
        
        foreach ($dangerousPatterns as $pattern) {
            if (strpos($lowerPath, $pattern) !== false) {
                return false;
            }
        }
        
        return true;
    }
}
