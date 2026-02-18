<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\Controller;

defined('_JEXEC') or die;

use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Language\Text;
use Phoca\Component\PhocaMosaic\Administrator\Model\BackupModel;

/**
 * Backup controller
 *
 * @since  6.0.0
 */
class BackupController extends BaseController
{
    /**
     * Undo edit via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function undoEdit(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkManagePermission();

        $app = $this->app;
        $input = $app->input;
        
        $imagePath = $input->getString('path', '');

        try {
            $model = new BackupModel();
            $result = $model->restoreBackup($imagePath);

            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => Text::_('COM_PHOCAMOSAIC_UNDO_SUCCESS')
                ]);
            } else {
                throw new \Exception('Failed to restore backup');
            }
        } catch (\Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Purge all backups via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function purgeBackups(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkManagePermission();

        $app = $this->app;

        try {
            $model = new BackupModel();
            $deletedCount = $model->purgeAllBackups();

            echo json_encode([
                'success' => true,
                'message' => Text::sprintf('COM_PHOCAMOSAIC_PURGE_SUCCESS', $deletedCount),
                'deletedCount' => $deletedCount
            ]);
        } catch (\Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Get backup info via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function getBackupInfo(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkManagePermission();

        $app = $this->app;

        try {
            $model = new BackupModel();
            $totalSize = $model->calculateBackupSize();

            echo json_encode([
                'success' => true,
                'data' => [
                    'totalSize' => $totalSize,
                    'formattedSize' => $this->formatBytes($totalSize)
                ]
            ]);
        } catch (\Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Format bytes to human-readable size
     *
     * @param   int  $bytes  Bytes
     *
     * @return  string  Formatted size
     *
     * @since   6.0.0
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check manage permission
     *
     * @return  void
     *
     * @throws  \Exception  If user doesn't have permission
     *
     * @since   6.0.0
     */
    private function checkManagePermission(): void
    {
        $user = $this->app->getIdentity();
        
        if (!$user->authorise('core.manage', 'com_phocamosaic')) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }
}
