<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\View\Editor;

defined('_JEXEC') or die;

use Joomla\CMS\MVC\View\HtmlView as BaseHtmlView;
use Joomla\CMS\Factory;

/**
 * Editor HTML view
 *
 * @since  6.0.0
 */
class HtmlView extends BaseHtmlView
{
    /**
     * Image path
     *
     * @var string
     */
    public string $imagePath;

    /**
     * Display the view
     *
     * @param   string  $tpl  Template name
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function display($tpl = null): void
    {
        $app = Factory::getApplication();
        $this->imagePath = $app->input->getString('path', '');

        // Set page title and subheading
        Factory::getApplication()->getDocument()->setTitle(basename($this->imagePath));
        
        // Load Web Assets
        $wa = $app->getDocument()->getWebAssetManager();
        $wa->useStyle('com_phocamosaic.mosaic-ui');
        $wa->useStyle('com_phocamosaic.editor-css');
        $wa->useScript('com_phocamosaic.editor');
        
        // Pass translations to JavaScript
        $this->loadTranslations();

        parent::display($tpl);
    }
    
    /**
     * Load translations for JavaScript
     *
     * @return  void
     *
     * @since   6.0.0
     */
    private function loadTranslations(): void
    {
        $translations = [
            'COM_PHOCAMOSAIC_TOOL_OPTIONS',
            'COM_PHOCAMOSAIC_SELECT_TOOL',
            'COM_PHOCAMOSAIC_INTENSITY',
            'COM_PHOCAMOSAIC_APPLY',
            'COM_PHOCAMOSAIC_CANCEL',
            'COM_PHOCAMOSAIC_FILTER_APPLIED',
            'COM_PHOCAMOSAIC_IMAGE_RESET',
            'COM_PHOCAMOSAIC_RESET_CHANGES',
            'COM_PHOCAMOSAIC_RESET_CONFIRM',
            'COM_PHOCAMOSAIC_IMAGE_SAVED',
            'COM_PHOCAMOSAIC_FAILED_SAVE',
            'COM_PHOCAMOSAIC_ENTER_FILENAME',
            'COM_PHOCAMOSAIC_ENTER_PRESET_NAME',
            'COM_PHOCAMOSAIC_PRESET_SAVED',
            'COM_PHOCAMOSAIC_NO_PRESETS',
            'COM_PHOCAMOSAIC_PRESET_LOADED',
            'COM_PHOCAMOSAIC_FAILED_SAVE_PRESET',
            'COM_PHOCAMOSAIC_FAILED_LOAD_PRESETS',
            'COM_PHOCAMOSAIC_PRESET_DELETED',
            'COM_PHOCAMOSAIC_FAILED_DELETE_PRESET',
            'COM_PHOCAMOSAIC_ROTATED',
            'COM_PHOCAMOSAIC_IMAGE_MIRRORED',
            'COM_PHOCAMOSAIC_IMAGE_FLIPPED',
            'COM_PHOCAMOSAIC_INVALID_DIMENSIONS',
            'COM_PHOCAMOSAIC_RESIZED_TO',
            'COM_PHOCAMOSAIC_CROPPED_TO',
            'COM_PHOCAMOSAIC_IMAGE_SAVED_AS',
            'COM_PHOCAMOSAIC_LOADING',
            'COM_PHOCAMOSAIC_ERROR_LOAD_IMAGE',
            'COM_PHOCAMOSAIC_ERROR_UNKNOWN',
            'COM_PHOCAMOSAIC_CROP',
            'COM_PHOCAMOSAIC_CROP_DRAG_MOVE',
            'COM_PHOCAMOSAIC_CROP_DRAG_RESIZE',
            'COM_PHOCAMOSAIC_WIDTH',
            'COM_PHOCAMOSAIC_HEIGHT',
            'COM_PHOCAMOSAIC_APPLY_CROP',
            'COM_PHOCAMOSAIC_STRAIGHTEN',
            'COM_PHOCAMOSAIC_ROTATION_ANGLE',
            'COM_PHOCAMOSAIC_STRAIGHTEN_APPLIED',
            // Filter names
            'COM_PHOCAMOSAIC_FEELING_LUCKY',
            'COM_PHOCAMOSAIC_AUTOCONTRAST',
            'COM_PHOCAMOSAIC_AUTOCOLOR',
            'COM_PHOCAMOSAIC_FILL_LIGHT',
            'COM_PHOCAMOSAIC_HIGHLIGHTS',
            'COM_PHOCAMOSAIC_SHADOWS',
            'COM_PHOCAMOSAIC_COLOR_TEMP',
            'COM_PHOCAMOSAIC_BRIGHTNESS',
            'COM_PHOCAMOSAIC_CONTRAST',
            'COM_PHOCAMOSAIC_SHARPEN',
            'COM_PHOCAMOSAIC_SEPIA',
            'COM_PHOCAMOSAIC_BW',
            'COM_PHOCAMOSAIC_WARMIFY',
            'COM_PHOCAMOSAIC_FILM_GRAIN',
            'COM_PHOCAMOSAIC_TINT',
            'COM_PHOCAMOSAIC_SATURATION',
            'COM_PHOCAMOSAIC_SOFT_FOCUS',
            'COM_PHOCAMOSAIC_GLOW',
            'COM_PHOCAMOSAIC_FILTERED_BW',
            'COM_PHOCAMOSAIC_FOCAL_BW',
            'COM_PHOCAMOSAIC_GRADUATED_TINT',
            'COM_PHOCAMOSAIC_INFRARED',
            'COM_PHOCAMOSAIC_LOMO',
            'COM_PHOCAMOSAIC_HOLGA',
            'COM_PHOCAMOSAIC_HDR_SCAPE',
            'COM_PHOCAMOSAIC_CINEMASCOPE',
            'COM_PHOCAMOSAIC_ORTON',
            'COM_PHOCAMOSAIC_1960S',
            'COM_PHOCAMOSAIC_INVERT_COLORS',
            'COM_PHOCAMOSAIC_HEAT_MAP',
            'COM_PHOCAMOSAIC_CROSS_PROCESS',
            'COM_PHOCAMOSAIC_POSTERIZE',
            'COM_PHOCAMOSAIC_DUO_TONE',
            'COM_PHOCAMOSAIC_BOOST',
            'COM_PHOCAMOSAIC_SOFTEN',
            'COM_PHOCAMOSAIC_VIGNETTE',
            'COM_PHOCAMOSAIC_PIXELATE',
            'COM_PHOCAMOSAIC_FOCAL_ZOOM',
            'COM_PHOCAMOSAIC_PENCIL_SKETCH',
            'COM_PHOCAMOSAIC_NEON',
            'COM_PHOCAMOSAIC_COMIC_BOOK',
            'COM_PHOCAMOSAIC_TILT_SHIFT',
            'COM_PHOCAMOSAIC_VALENCIA',
            'COM_PHOCAMOSAIC_NASHVILLE',
            'COM_PHOCAMOSAIC_CLARENDON',
            'COM_PHOCAMOSAIC_GINGHAM',
            'COM_PHOCAMOSAIC_JUNO',
            'COM_PHOCAMOSAIC_LARK',
        ];
        
        $translatedStrings = [];
        foreach ($translations as $key) {
            $translatedStrings[$key] = \Joomla\CMS\Language\Text::_($key);
        }
        
        Factory::getApplication()->getDocument()->addScriptOptions('com_phocamosaic.translations', $translatedStrings);
    }
}
