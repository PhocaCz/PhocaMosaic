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

use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\MVC\Controller\BaseController;
use Joomla\CMS\Session\Session;
use Phoca\Component\PhocaMosaic\Administrator\Model\ExplorerModel;

/**
 * Explorer controller
 *
 * @since  6.0.0
 */
class ExplorerController extends BaseController
{
    /**
     * Display the explorer view
     *
     * @param   bool    $cachable   Cachable
     * @param   array   $urlparams  URL parameters
     *
     * @return  static
     *
     * @since   6.0.0
     */
    public function display($cachable = false, $urlparams = [])
    {
        $this->checkPermissions();
        return parent::display($cachable, $urlparams);
    }

    /**
     * Get folder contents via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function getFolderContents(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;
        $input = $app->input;
        
        // Set format to raw to prevent template rendering
        $input->set('format', 'raw');
        
        $folderPath = $input->getString('path', '/images');
        $recursive = $input->getBool('recursive', false); // Default to false (non-recursive)

        try {
            $model = new ExplorerModel();
            $images = $model->getImagesInFolder($folderPath, $recursive);

            // Set JSON response
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'data' => $images
            ]);
            /*
            ,
                'debug' => [
                    'folderPath' => $folderPath,
                    'recursive' => $recursive,
                    'recursiveRaw' => $input->get('recursive'),
                    'count' => count($images)
                ]
                    */
        } catch (\Exception $e) {
            if (defined('JDEBUG') && JDEBUG) {
                Factory::getApplication()->getLogger()->error(
                    'PhocaMosaic getFolderContents: ' . $e->getMessage(),
                    ['trace' => $e->getTraceAsString()]
                );
            }

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode(['success' => false, 'message' => Text::_('COM_PHOCAMOSAIC_ERROR_GENERIC')]);
        }

        /*
        } catch (\Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
        } */

        $app->close();
    }

    /**
     * Search images via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function searchImages(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;
        $input = $app->input;
        
        // Set format to raw to prevent template rendering
        $input->set('format', 'raw');
        
        $query = $input->getString('query', '');
        $folderPath = $input->getString('path', null);

        try {
            $model = new ExplorerModel();
            $images = $model->searchImages($query, $folderPath);

            // Set JSON response
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'data' => $images
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Get folder tree via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function getFolderTree(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;
        
        // Set format to raw to prevent template rendering
        $app->input->set('format', 'raw');

        try {
            $model = new ExplorerModel();
            $tree = $model->getFolderTree('/images');
            // Set JSON response
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'data' => $tree
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Upload images via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function uploadImages(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();
        $this->checkUploadRateLimit();

        $app = $this->app;
        $input = $app->input;
        
        $folder = $input->getString('folder', 'images');
        $files = $input->files->get('files', [], 'array');

        try {
            if (empty($files)) {
                throw new \Exception('No files uploaded');
            }

            $model = new ExplorerModel();
            $result = $model->uploadImages($files, $folder);

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'uploaded' => $result['uploaded'],
                'failed' => $result['failed'],
                'message' => sprintf('Uploaded %d file(s), %d failed', $result['uploaded'], $result['failed'])
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Check user permissions
     *
     * @return  void
     *
     * @throws  \Exception  If user doesn't have permission
     *
     * @since   6.0.0
     */
    private function checkPermissions(): void
    {
        $user = $this->app->getIdentity();
        
        if (!$user->authorise('core.manage', 'com_phocamosaic')) {
            throw new \Exception(Text::_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }

    /**
     * Rename an image file
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function renameImage(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;
        $input = $app->input;
        
        $path = $input->getString('path', '');
        $newFilename = $input->getString('newFilename', '');

        try {
            if (empty($path) || empty($newFilename)) {
                throw new \Exception('Missing required parameters');
            }

            $model = new ExplorerModel();
            $result = $model->renameImage($path, $newFilename);

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => 'Image renamed successfully',
                'newFilename' => $result['newFilename']
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Delete an image file
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function deleteImage(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;
        $input = $app->input;
        
        $path = $input->getString('path', '');

        try {
            if (empty($path)) {
                throw new \Exception('Missing required parameters');
            }

            $model = new ExplorerModel();
            $model->deleteImage($path);

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => 'Image deleted successfully'
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Count all backup files
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function countBackups(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;

        try {
            $model = new ExplorerModel();
            $count = $model->countBackupFiles();

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Delete all backup files
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function deleteBackups(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;

        try {
            $model = new ExplorerModel();
            $count = $model->deleteAllBackups();

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => sprintf('Deleted %d backup file(s)', $count),
                'count' => $count
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Create a new folder
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function createFolder(): void
    {
        Session::checkToken('post') or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkPermissions();

        $app = $this->app;
        $input = $app->input;
        
        $parentPath = $input->getString('parentPath', '');
        $folderName = $input->getString('folderName', '');

        try {
            if (empty($parentPath)) {
                throw new \Exception('Parent path is required');
            }
            
            if (empty($folderName)) {
                throw new \Exception('Folder name is required');
            }

            $model = new ExplorerModel();
            $result = $model->createFolder($parentPath, $folderName);

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => 'Folder created successfully',
                'path' => $result['path']
            ]);
        } catch (\Exception $e) {
            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }

        $app->close();
    }

    /**
     * Check and increment the upload rate limit counter.
     * Throws if the user has exceeded maxUploads in windowSeconds.
     */
    private function checkUploadRateLimit(int $maxUploads = 20, int $windowSeconds = 60): void
    {
        $session = $this->app->getSession();
        $key     = 'com_phocamosaic.upload_rate';
        $now     = time();

        $data = $session->get($key, ['count' => 0, 'window_start' => $now]);

        if (($now - $data['window_start']) > $windowSeconds) {
            // Reset window
            $data = ['count' => 0, 'window_start' => $now];
        }

        $data['count']++;
        $session->set($key, $data);

        if ($data['count'] > $maxUploads) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_RATE_LIMIT_EXCEEDED'));
        }
    }
}

