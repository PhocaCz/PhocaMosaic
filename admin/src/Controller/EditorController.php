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
use Phoca\Component\PhocaMosaic\Administrator\Model\ImageModel;
use Phoca\Component\PhocaMosaic\Administrator\Model\MetadataModel;

/**
 * Editor controller
 *
 * @since  6.0.0
 */
class EditorController extends BaseController
{
    /**
     * Display the editor view
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
        $this->checkEditPermission();
        return parent::display($cachable, $urlparams);
    }

    /**
     * Save edited image via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function saveImage(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkEditPermission();

        $app = $this->app;
        $input = $app->input;
        
        // Set format to raw to prevent template rendering
        $input->set('format', 'raw');
        
        $imagePath = $input->getString('path', '');
        $files = $input->files->get('image');

        try {
            if (empty($imagePath)) {
                throw new \Exception('Image path is required');
            }
            
            if (empty($files) || $files['error'] !== UPLOAD_ERR_OK) {
                throw new \Exception('No image file uploaded');
            }
            
            $model = new ImageModel();
            $result = $model->saveEditedImage($imagePath, $files['tmp_name']);

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => Text::_('COM_PHOCAMOSAIC_SAVE_SUCCESS')
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
     * Save edited image as new file via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function saveAsImage(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkEditPermission();

        $app = $this->app;
        $input = $app->input;
        
        $imagePath = $input->getString('path', '');
        $filename = $input->getString('filename', '');
        $imageFormat = $input->getString('format', 'jpg');
        $files = $input->files->get('image');

        try {
            if (empty($imagePath)) {
                throw new \Exception('Image path is required');
            }
            
            if (empty($filename)) {
                throw new \Exception('Filename is required');
            }
            
            if (empty($files) || $files['error'] !== UPLOAD_ERR_OK) {
                throw new \Exception('No image file uploaded');
            }
            
            // Validate format
            $allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (!in_array(strtolower($imageFormat), $allowedFormats)) {
                throw new \Exception('Invalid image format');
            }
            
            // Get directory from original path
            $pathInfo = pathinfo($imagePath);
            $directory = $pathInfo['dirname'];
            
            // Sanitize filename
            $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
            
            // Create new path with new filename and format
            $newPath = $directory . '/' . $filename . '.' . $imageFormat;
            
            $model = new ImageModel();
            $result = $model->saveEditedImage($newPath, $files['tmp_name']);

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => Text::_('COM_PHOCAMOSAIC_SAVE_SUCCESS'),
                'path' => $newPath
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
     * Apply edit operation via AJAX (for real-time preview)
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function applyEdit(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkEditPermission();

        $app = $this->app;
        $input = $app->input;
        
        $imagePath = $input->getString('path', '');
        $operation = $input->get('operation', [], 'array');

        try {
            // This endpoint is for client-side preview only
            // Actual processing happens in JavaScript Canvas
            echo json_encode([
                'success' => true,
                'message' => 'Preview updated'
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
     * Get image metadata via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function getMetadata(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkEditPermission();

        $app = $this->app;
        $input = $app->input;
        
        $imagePath = $input->getString('path', '');

        try {
            $model = new MetadataModel();
            $metadata = $model->loadMetadata($imagePath);

            echo json_encode([
                'success' => true,
                'data' => $metadata
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
     * Save preset to database via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function savePreset(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkEditPermission();

        $app = $this->app;
        $input = $app->input;
        
        $name = $input->getString('name', '');
        $filters = $input->get('filters', [], 'array');

        try {
            if (empty($name)) {
                throw new \Exception('Preset name is required');
            }
            
            if (empty($filters)) {
                throw new \Exception('Filters are required');
            }
            
            $model = new \Phoca\Component\PhocaMosaic\Administrator\Model\PresetModel();
            $id = $model->savePreset($name, $filters);

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => Text::_('COM_PHOCAMOSAIC_PRESET_SAVED'),
                'id' => $id
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
     * Load presets from database via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function loadPresets(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkEditPermission();

        $app = $this->app;

        try {
            $model = new \Phoca\Component\PhocaMosaic\Administrator\Model\PresetModel();
            $presets = $model->loadPresets();

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'presets' => $presets
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
     * Delete preset from database via AJAX
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function deletePreset(): void
    {
        Session::checkToken() or jexit(Text::_('JINVALID_TOKEN'));
        $this->checkEditPermission();

        $app = $this->app;
        $input = $app->input;
        
        $id = $input->getInt('id', 0);

        try {
            if ($id <= 0) {
                throw new \Exception('Invalid preset ID');
            }
            
            $model = new \Phoca\Component\PhocaMosaic\Administrator\Model\PresetModel();
            $success = $model->deletePreset($id);

            if (!$success) {
                throw new \Exception('Preset not found or permission denied');
            }

            $app->setHeader('Content-Type', 'application/json', true);
            echo json_encode([
                'success' => true,
                'message' => Text::_('COM_PHOCAMOSAIC_PRESET_DELETED')
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
     * Check edit permission
     *
     * @return  void
     *
     * @throws  \Exception  If user doesn't have permission
     *
     * @since   6.0.0
     */
    private function checkEditPermission(): void
    {
        $user = $this->app->getIdentity();
        
        if (!$user->authorise('core.edit', 'com_phocamosaic')) {
            throw new \Exception(Text::_('COM_PHOCAMOSAIC_ERROR_PERMISSION'), 403);
        }
    }
}
