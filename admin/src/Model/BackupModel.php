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

use Joomla\CMS\MVC\Model\BaseModel;
use Joomla\Filesystem\File;
use Joomla\Filesystem\Folder;

/**
 * Backup model for non-destructive image editing
 *
 * @since  6.0.0
 */
class BackupModel extends BaseModel
{
    /**
     * Backup subfolder name
     *
     * @var string
     */
    private const BACKUP_FOLDER = '.mosaicoriginals';

    /**
     * Create backup of an image
     *
     * @param   string  $imagePath  Absolute path to image
     *
     * @return  bool  True on success
     *
     * @since   6.0.0
     */
    public function createBackup(string $imagePath): bool
    {
        if (!file_exists($imagePath)) {
            return false;
        }

        $directory = dirname($imagePath);
        $filename = basename($imagePath);
        $backupFolder = $directory . '/' . self::BACKUP_FOLDER;

        // Check if .mosaicoriginals folder exists
        if (is_dir($backupFolder)) {
            // Move to backup folder
            $backupPath = $backupFolder . '/' . $filename;
            return File::copy($imagePath, $backupPath);
        } else {
            // Create .phmos.bak file
            $backupPath = $imagePath . '.phmos.bak';
            return File::copy($imagePath, $backupPath);
        }
    }

    /**
     * Restore backup of an image
     *
     * @param   string  $imagePath  Absolute path to image
     *
     * @return  bool  True on success
     *
     * @since   6.0.0
     */
    public function restoreBackup(string $imagePath): bool
    {
        $backupPath = $this->getBackupPath($imagePath);

        if ($backupPath === null || !file_exists($backupPath)) {
            return false;
        }

        // Restore backup
        $result = File::copy($backupPath, $imagePath);

        // Delete backup file
        if ($result) {
            File::delete($backupPath);
        }

        return $result;
    }

    /**
     * Check if backup exists for an image
     *
     * @param   string  $imagePath  Absolute path to image
     *
     * @return  bool  True if backup exists
     *
     * @since   6.0.0
     */
    public function hasBackup(string $imagePath): bool
    {
        return $this->getBackupPath($imagePath) !== null;
    }

    /**
     * Get backup path for an image
     *
     * @param   string  $imagePath  Absolute path to image
     *
     * @return  string|null  Backup path or null if not found
     *
     * @since   6.0.0
     */
    public function getBackupPath(string $imagePath): ?string
    {
        $directory = dirname($imagePath);
        $filename = basename($imagePath);
        
        // Check .mosaicoriginals folder
        $backupFolder = $directory . '/' . self::BACKUP_FOLDER;
        $backupInFolder = $backupFolder . '/' . $filename;
        
        if (file_exists($backupInFolder)) {
            return $backupInFolder;
        }

        // Check .phmos.bak file
        $bakFile = $imagePath . '.phmos.bak';
        
        if (file_exists($bakFile)) {
            return $bakFile;
        }
        
        // Check old .bak file for backward compatibility
        $oldBakFile = $imagePath . '.bak';
        
        if (file_exists($oldBakFile)) {
            return $oldBakFile;
        }

        return null;
    }

    /**
     * Calculate total size of backups
     *
     * @param   string|null  $directory  Directory to scan (null for all images)
     *
     * @return  int  Total size in bytes
     *
     * @since   6.0.0
     */
    public function calculateBackupSize(?string $directory = null): int
    {
        $totalSize = 0;
        $searchDir = $directory ?? JPATH_ROOT . '/images';

        // Find all .phmos.bak files
        $bakFiles = Folder::files($searchDir, '\.phmos\.bak$', true, true);
        
        foreach ($bakFiles as $file) {
            $totalSize += filesize($file);
        }
        
        // Find old .bak files for backward compatibility
        /*$oldBakFiles = Folder::files($searchDir, '\.bak$', true, true);
        
        foreach ($oldBakFiles as $file) {
            // Skip if it's a .phmos.bak file (already counted)
            if (!str_ends_with($file, '.phmos.bak')) {
                $totalSize += filesize($file);
            }
        }*/

        // Find all .mosaicoriginals folders
        $folders = Folder::folders($searchDir, self::BACKUP_FOLDER, true, true);
        
        foreach ($folders as $folder) {
            $files = Folder::files($folder, '.', false, true);
            
            foreach ($files as $file) {
                $totalSize += filesize($file);
            }
        }

        return $totalSize;
    }

    /**
     * Purge all backup files
     *
     * @param   string|null  $directory  Directory to purge (null for all images)
     *
     * @return  int  Number of files deleted
     *
     * @since   6.0.0
     */
    public function purgeAllBackups(?string $directory = null): int
    {
        $deletedCount = 0;
        $searchDir = $directory ?? JPATH_ROOT . '/images';

        // Delete all .phmos.bak files
        $bakFiles = Folder::files($searchDir, '\.phmos\.bak$', true, true);
        
        foreach ($bakFiles as $file) {
            if (File::delete($file)) {
                $deletedCount++;
            }
        }
        
        // Delete old .bak files for backward compatibility
        /*$oldBakFiles = Folder::files($searchDir, '\.bak$', true, true);
        
        foreach ($oldBakFiles as $file) {
            // Skip if it's a .phmos.bak file (already deleted)
            if (!str_ends_with($file, '.phmos.bak')) {
                if (File::delete($file)) {
                    $deletedCount++;
                }
            }
        }*/

        // Delete all .mosaicoriginals folders
        $folders = Folder::folders($searchDir, self::BACKUP_FOLDER, true, true);
        
        foreach ($folders as $folder) {
            $files = Folder::files($folder, '.', false, true);
            $deletedCount += count($files);
            Folder::delete($folder);
        }

        return $deletedCount;
    }
}
