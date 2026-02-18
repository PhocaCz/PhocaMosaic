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
use Joomla\CMS\MVC\Model\BaseModel;
use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Language\Text;
use Joomla\Filesystem\Folder;
use Phoca\Component\PhocaMosaic\Administrator\Service\PathSanitizer;

/**
 * Explorer model for browsing images
 *
 * @since  6.0.0
 */
class ExplorerModel extends BaseModel
{
    /**
     * Path sanitizer service
     *
     * @var PathSanitizer
     */
    private PathSanitizer $pathSanitizer;

    /**
     * Supported image extensions
     *
     * @var array
     */
    private array $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    /**
     * Constructor
     *
     * @since  6.0.0
     */
    public function __construct()
    {
        parent::__construct();
        
        // Create service directly instead of using DI container
        $this->pathSanitizer = new PathSanitizer();
    }

    /**
     * Get folder tree structure
     *
     * @param   string  $rootPath  Root path to scan
     *
     * @return  array  Folder tree
     *
     * @since   6.0.0
     */
    public function getFolderTree(string $rootPath = '/images'): array
    {
        try {
            $absolutePath = $this->pathSanitizer->sanitizePath($rootPath);
            return $this->buildFolderTree($absolutePath);
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Build folder tree recursively
     *
     * @param   string  $path  Directory path
     *
     * @return  array  Folder tree node
     *
     * @since   6.0.0
     */
    private function buildFolderTree(string $path): array
    {
        $folders = Folder::folders($path, '.', false, true);
        $children = [];

        foreach ($folders as $folder) {
            // Skip hidden folders
            if (strpos(basename($folder), '.') === 0) {
                continue;
            }

            $children[] = $this->buildFolderTree($folder);
        }

        // Get image count - pass relative path
        $relativePath = $this->pathSanitizer->getRelativePath($path);
        $images = $this->getImagesInFolder($relativePath);
        $imageCount = count($images);

        return [
            'path' => $relativePath,
            'name' => basename($path),
            'children' => $children,
            'imageCount' => $imageCount,
            'hasSubfolders' => !empty($children)
        ];
    }

    /**
     * Get images in a folder
     *
     * @param   string  $folderPath  Folder path
     * @param   bool    $recursive   Scan recursively
     *
     * @return  array  Array of image data
     *
     * @since   6.0.0
     */
    public function getImagesInFolder(string $folderPath, bool $recursive = false): array
    {
        try {
            $absolutePath = $this->pathSanitizer->sanitizePath($folderPath);
            $pattern = '\.(' . implode('|', $this->imageExtensions) . ')$';
            
            // FORCE non-recursive - only current folder
            $files = Folder::files($absolutePath, $pattern, false, true);

            $images = [];

            foreach ($files as $file) {
                // Skip files in hidden folders
                if (strpos($file, '/.') !== false) {
                    continue;
                }

                // Skip backup files
                if (str_ends_with($file, '.phmos.bak')) {
                    continue;
                }

                try {
                    $images[] = $this->getImageData($file);
                } catch (\Exception $e) {
                    // Skip files that can't be processed
                    continue;
                }
            }

            return $images;
        } catch (\Exception $e) {
            // Log error for debugging
            Factory::getApplication()->enqueueMessage(Text::sprintf('COM_PHOCAMOSAIC_ERROR_GET_IMAGES', $e->getMessage()), 'error');
            return [];
        }
    }

    /**
     * Get image data
     *
     * @param   string  $absolutePath  Absolute path to image
     *
     * @return  array  Image data
     *
     * @since   6.0.0
     */
    private function getImageData(string $absolutePath): array
    {
        $info = @getimagesize($absolutePath);

        return [
            'path' => $this->pathSanitizer->getRelativePath($absolutePath),
            'filename' => basename($absolutePath),
            'thumbnailUrl' => $this->getThumbnailUrl($absolutePath),
            'dimensions' => [
                'width' => $info[0] ?? 0,
                'height' => $info[1] ?? 0
            ],
            'fileSize' => filesize($absolutePath),
            'dateModified' => date('Y-m-d H:i:s', filemtime($absolutePath)),
            'hasBackup' => $this->checkBackup($absolutePath)
        ];
    }

    /**
     * Get thumbnail URL for an image
     *
     * @param   string  $absolutePath  Absolute path to image
     *
     * @return  string  Thumbnail URL
     *
     * @since   6.0.0
     */
    private function getThumbnailUrl(string $absolutePath): string
    {
        $relativePath = $this->pathSanitizer->getRelativePath($absolutePath);
        // Use Joomla's URI to get the correct base URL
        $baseUrl = \Joomla\CMS\Uri\Uri::root();
        return $baseUrl . $relativePath;
    }

    /**
     * Check if image has backup
     *
     * @param   string  $absolutePath  Absolute path to image
     *
     * @return  bool  True if backup exists
     *
     * @since   6.0.0
     */
    private function checkBackup(string $absolutePath): bool
    {
        try {
            $backupModel = new BackupModel();
            return $backupModel->hasBackup($absolutePath);
        } catch (\Exception $e) {
            // If BackupModel fails, just return false
            return false;
        }
    }

    /**
     * Search images by filename
     *
     * @param   string       $query       Search query
     * @param   string|null  $folderPath  Folder to search in (null for all)
     *
     * @return  array  Array of matching images
     *
     * @since   6.0.0
     */
    public function searchImages(string $query, ?string $folderPath = null): array
    {
        $searchPath = $folderPath ?? '/images';
        // Search is recursive - searches all subfolders
        $images = $this->getImagesInFolderRecursive($searchPath);

        if (empty($query)) {
            return $images;
        }

        $query = strtolower($query);

        return array_filter($images, function ($image) use ($query) {
            return strpos(strtolower($image['filename']), $query) !== false;
        });
    }
    
    /**
     * Get images in a folder recursively (for search)
     *
     * @param   string  $folderPath  Folder path
     *
     * @return  array  Array of image data
     *
     * @since   6.0.0
     */
    private function getImagesInFolderRecursive(string $folderPath): array
    {
        try {
            $absolutePath = $this->pathSanitizer->sanitizePath($folderPath);
            $pattern = '\.(' . implode('|', $this->imageExtensions) . ')$';
            $files = Folder::files($absolutePath, $pattern, true, true);

            $images = [];

            foreach ($files as $file) {
                if (strpos($file, '/.') !== false) {
                    continue;
                }

                // Skip backup files
                if (str_ends_with($file, '.phmos.bak')) {
                    continue;
                }

                try {
                    $images[] = $this->getImageData($file);
                } catch (\Exception $e) {
                    continue;
                }
            }

            return $images;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Filter images by date range
     *
     * @param   string     $folderPath  Folder path
     * @param   \DateTime  $startDate   Start date
     * @param   \DateTime  $endDate     End date
     *
     * @return  array  Array of matching images
     *
     * @since   6.0.0
     */
    public function filterByDate(string $folderPath, \DateTime $startDate, \DateTime $endDate): array
    {
        $images = $this->getImagesInFolderRecursive($folderPath);

        return array_filter($images, function ($image) use ($startDate, $endDate) {
            $imageDate = new \DateTime($image['dateModified']);
            return $imageDate >= $startDate && $imageDate <= $endDate;
        });
    }

    /**
     * Upload images to folder
     *
     * @param   array   $files   Array of uploaded files
     * @param   string  $folder  Target folder path
     *
     * @return  array  Upload results with uploaded and failed counts
     *
     * @since   6.0.0
     */
    public function uploadImages(array $files, string $folder): array
    {
        $uploaded = 0;
        $failed = 0;
        $errors = [];

        // Get max upload size from component configuration
        $params = ComponentHelper::getParams('com_phocamosaic');
        $maxUploadSize = $params->get('max_upload_size', 5242880); // Default 5 MB

        // Sanitize folder path
        $targetPath = $this->pathSanitizer->sanitizePath($folder);

        // Ensure target directory exists
        if (!is_dir($targetPath)) {
            mkdir($targetPath, 0755, true);
        }

        foreach ($files as $file) {
            // Check for upload errors
            if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
                $failed++;
                $errorMsg = $this->getUploadErrorMessage($file['error'] ?? UPLOAD_ERR_NO_FILE);
                $errors[] = ($file['name'] ?? 'unknown') . ': ' . $errorMsg;
                continue;
            }

            // Validate file size
            if ($file['size'] > $maxUploadSize) {
                $failed++;
                $maxSizeMB = round($maxUploadSize / 1048576, 1);
                $errors[] = $file['name'] . ': ' . Text::sprintf('COM_PHOCAMOSAIC_ERROR_FILE_TOO_LARGE', $maxSizeMB);
                continue;
            }

            // Validate file type by extension
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $this->imageExtensions)) {
                $failed++;
                $errors[] = $file['name'] . ': ' . Text::_('COM_PHOCAMOSAIC_ERROR_INVALID_FILE_TYPE');
                continue;
            }

            // Validate MIME type for additional security
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($mimeType, $allowedMimes)) {
                $failed++;
                $errors[] = $file['name'] . ': ' . Text::_('COM_PHOCAMOSAIC_ERROR_INVALID_FILE_CONTENT');
                continue;
            }

            // Verify it's actually an image by trying to get image info
            $imageInfo = @getimagesize($file['tmp_name']);
            if ($imageInfo === false) {
                $failed++;
                $errors[] = $file['name'] . ': ' . Text::_('COM_PHOCAMOSAIC_ERROR_NOT_VALID_IMAGE');
                continue;
            }

            // Sanitize filename - remove any dangerous characters
            $filename = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $file['name']);
            $destination = $targetPath . '/' . $filename;

            // Check if file already exists
            if (file_exists($destination)) {
                // Add timestamp to make unique
                $name = pathinfo($filename, PATHINFO_FILENAME);
                $filename = $name . '_' . time() . '.' . $ext;
                $destination = $targetPath . '/' . $filename;
            }

            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $destination)) {
                chmod($destination, 0644);
                $uploaded++;
            } else {
                $failed++;
                $errors[] = $file['name'] . ': ' . Text::_('COM_PHOCAMOSAIC_ERROR_FAILED_TO_SAVE');
            }
        }

        return [
            'uploaded' => $uploaded,
            'failed' => $failed,
            'errors' => $errors
        ];
    }

    /**
     * Get human-readable upload error message
     *
     * @param   int  $errorCode  PHP upload error code
     *
     * @return  string  Error message
     */
    private function getUploadErrorMessage(int $errorCode): string
    {
        switch ($errorCode) {
            case UPLOAD_ERR_INI_SIZE:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_INI_SIZE');
            case UPLOAD_ERR_FORM_SIZE:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_FORM_SIZE');
            case UPLOAD_ERR_PARTIAL:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_PARTIAL');
            case UPLOAD_ERR_NO_FILE:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_NO_FILE');
            case UPLOAD_ERR_NO_TMP_DIR:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_NO_TMP_DIR');
            case UPLOAD_ERR_CANT_WRITE:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_CANT_WRITE');
            case UPLOAD_ERR_EXTENSION:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_EXTENSION');
            default:
                return Text::_('COM_PHOCAMOSAIC_ERROR_UPLOAD_UNKNOWN');
        }
    }

    /**
     * Rename an image file
     *
     * @param   string  $path         Current file path
     * @param   string  $newFilename  New filename
     *
     * @return  array   Result with new filename
     *
     * @throws  \Exception  On validation or file system errors
     *
     * @since   6.0.0
     */
    public function renameImage(string $path, string $newFilename): array
    {
        // Sanitize the current path
        $fullPath = $this->pathSanitizer->sanitizePath($path);
        
        if (!file_exists($fullPath)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FILE_NOT_FOUND'));
        }

        // Validate new filename
        $newFilename = trim($newFilename);
        if (empty($newFilename)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FILENAME_EMPTY'));
        }

        // Sanitize new filename - remove dangerous characters
        $newFilename = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $newFilename);
        
        // Check file extension is valid
        $ext = strtolower(pathinfo($newFilename, PATHINFO_EXTENSION));
        if (!in_array($ext, $this->imageExtensions)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_INVALID_EXTENSION'));
        }

        // Build new path
        $directory = dirname($fullPath);
        $newPath = $directory . '/' . $newFilename;

        // Check if new filename already exists
        if (file_exists($newPath) && $fullPath !== $newPath) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FILE_EXISTS'));
        }

        // Rename the file
        if (!rename($fullPath, $newPath)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_RENAME_FAILED'));
        }

        return [
            'newFilename' => $newFilename,
            'newPath' => $newPath
        ];
    }

    /**
     * Delete an image file
     *
     * @param   string  $path  File path to delete
     *
     * @return  void
     *
     * @throws  \Exception  On validation or file system errors
     *
     * @since   6.0.0
     */
    public function deleteImage(string $path): void
    {
        // Sanitize the path
        $fullPath = $this->pathSanitizer->sanitizePath($path);
        
        if (!file_exists($fullPath)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FILE_NOT_FOUND'));
        }

        // Verify it's a file, not a directory
        if (!is_file($fullPath)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_NOT_A_FILE'));
        }

        // Delete the file
        if (!unlink($fullPath)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_DELETE_FAILED'));
        }
    }

    /**
     * Count all backup files recursively
     *
     * @return  int  Number of backup files found
     *
     * @since   6.0.0
     */
    public function countBackupFiles(): int
    {
        $backups = $this->findAllBackups();
        return count($backups);
    }

    /**
     * Find all backup files recursively
     *
     * @return  array  Array of backup file paths
     *
     * @since   6.0.0
     */
    private function findAllBackups(): array
    {
        $backups = [];
        $rootPath = JPATH_ROOT . '/images';
        
        if (!is_dir($rootPath)) {
            Factory::getApplication()->enqueueMessage(Text::sprintf('COM_PHOCAMOSAIC_ERROR_DIR_NOT_FOUND', $rootPath), 'warning');
            return [];
        }
        
        $this->scanForBackups($rootPath, $backups);
        
        // Debug logging
        if (defined('JDEBUG') && JDEBUG) {
            Factory::getApplication()->enqueueMessage(Text::sprintf('COM_PHOCAMOSAIC_DEBUG_BACKUPS_FOUND', count($backups)), 'info');
        }
        
        return $backups;
    }

    /**
     * Recursively scan directory for backup files
     *
     * @param   string  $directory  Directory to scan
     * @param   array   &$backups   Array to store found backups
     *
     * @return  void
     *
     * @since   6.0.0
     */
    private function scanForBackups(string $directory, array &$backups): void
    {
        if (!is_dir($directory)) {
            return;
        }

        $items = @scandir($directory);
        
        if ($items === false) {
            return;
        }
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $path = $directory . '/' . $item;

            if (is_dir($path)) {
                // Recursively scan subdirectories
                $this->scanForBackups($path, $backups);
            } elseif (is_file($path) && str_ends_with($item, '.phmos.bak')) {
                // Found a backup file
                $backups[] = $path;
            }
        }
    }

    /**
     * Delete all backup files recursively
     *
     * @return  int  Number of files deleted
     *
     * @throws  \Exception  On file system errors
     *
     * @since   6.0.0
     */
    public function deleteAllBackups(): int
    {
        $backups = $this->findAllBackups();
        $deleted = 0;
        $errors = [];

        foreach ($backups as $backup) {
            if (unlink($backup)) {
                $deleted++;
            } else {
                $errors[] = basename($backup);
            }
        }

        if (!empty($errors) && $deleted === 0) {
            throw new \Exception(Text::sprintf('COM_PHOCAMOSAIC_ERROR_DELETE_BACKUPS_FAILED', implode(', ', $errors)));
        }

        return $deleted;
    }

    /**
     * Create a new folder
     *
     * @param   string  $parentPath  Parent directory path
     * @param   string  $folderName  New folder name
     *
     * @return  array   Result with new folder path
     *
     * @throws  \Exception  On validation or file system errors
     *
     * @since   6.0.0
     */
    public function createFolder(string $parentPath, string $folderName): array
    {
        // Sanitize parent path
        $fullParentPath = $this->pathSanitizer->sanitizePath($parentPath);
        
        if (!is_dir($fullParentPath)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_PARENT_DIR_NOT_FOUND'));
        }

        // Validate folder name
        $folderName = trim($folderName);
        if (empty($folderName)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FOLDER_NAME_EMPTY'));
        }

        // Sanitize folder name - remove dangerous characters and path separators
        $folderName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $folderName);
        
        // Prevent path traversal
        if (strpos($folderName, '..') !== false || strpos($folderName, '/') !== false || strpos($folderName, '\\') !== false) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_INVALID_FOLDER_NAME'));
        }

        // Build new folder path
        $newFolderPath = $fullParentPath . '/' . $folderName;

        // Check if folder already exists
        if (file_exists($newFolderPath)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_FOLDER_EXISTS'));
        }

        // Create the folder
        if (!mkdir($newFolderPath, 0755, false)) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_CREATE_FOLDER_FAILED'));
        }

        return [
            'path' => $this->pathSanitizer->getRelativePath($newFolderPath),
            'name' => $folderName
        ];
    }
}
