<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\View\Explorer;

defined('_JEXEC') or die;

use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Toolbar\ToolbarHelper;
use Joomla\CMS\MVC\View\HtmlView as BaseHtmlView;
use Phoca\Component\PhocaMosaic\Administrator\Helper\PhocaMosaicHelper;

/**
 * Explorer HTML view
 *
 * @since  6.0.0
 */
class HtmlView extends BaseHtmlView
{
    protected string $version = '6.0.0';
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
        // Load Web Assets manually since joomla.asset.json doesn't work
        $wa = Factory::getApplication()->getDocument()->getWebAssetManager();

        $this->version = PhocaMosaicHelper::getPhocaVersion('com_phocamosaic');
        
        // Register and use explorer CSS
        $wa->registerStyle(
            'com_phocamosaic.explorer',
            'media/com_phocamosaic/css/explorer.css'
        );
        $wa->useStyle('com_phocamosaic.explorer');
        
        // Register and use explorer JavaScript module
        $wa->registerAndUseScript(
            'com_phocamosaic.explorer',
            'media/com_phocamosaic/js/explorer.js',
            [],
            ['type' => 'module', 'defer' => true]
        );
        //$wa->useScript('com_phocamosaic.explorer');

        // Set toolbar
        $this->addToolbar();
        
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
            'COM_PHOCAMOSAIC_NO_IMAGES_FOUND',
            'COM_PHOCAMOSAIC_NO_PREVIEW',
            'COM_PHOCAMOSAIC_SHOW_INFO',
            'COM_PHOCAMOSAIC_INSERT',
            'COM_PHOCAMOSAIC_EDIT',
            'COM_PHOCAMOSAIC_INSERT_IMAGE',
            'COM_PHOCAMOSAIC_IMAGE_ALT',
            'COM_PHOCAMOSAIC_IMAGE_LAZY_LOAD',
            'COM_PHOCAMOSAIC_IMAGE_CLASS',
            'COM_PHOCAMOSAIC_FIGURE_CLASS',
            'COM_PHOCAMOSAIC_FIGURE_CAPTION',
            'COM_PHOCAMOSAIC_CANCEL',
            'COM_PHOCAMOSAIC_RENAME',
            'COM_PHOCAMOSAIC_DELETE',
            'COM_PHOCAMOSAIC_ERROR_FILENAME_EMPTY',
            'COM_PHOCAMOSAIC_ERROR_RENAME_FAILED',
            'COM_PHOCAMOSAIC_ERROR_FOLDER_NAME_EMPTY',
            'COM_PHOCAMOSAIC_ERROR_FOLDER_NAME_INVALID_CHARS',
            'COM_PHOCAMOSAIC_ERROR_CREATE_FOLDER_FAILED',
        ];
        
        $translatedStrings = [];
        foreach ($translations as $key) {
            $translatedStrings[$key] = Text::_($key);
        }
        
        Factory::getApplication()->getDocument()->addScriptOptions('com_phocamosaic.translations', $translatedStrings);
    }

    /**
     * Add toolbar
     *
     * @return  void
     *
     * @since   6.0.0
     */
    protected function addToolbar(): void
    {

        $tmpl    = Factory::getApplication()->getInput()->getCmd('tmpl');
        $toolbar = $this->getDocument()->getToolbar();
        $user    = $this->getCurrentUser();

        ToolbarHelper::title(Text::_('COM_PHOCAMOSAIC_EXPLORER'), 'picture');
        
        // Get toolbar instance
        $toolbar = Factory::getApplication()->getDocument()->getToolbar();

        if ($tmpl !== 'component') {
            $toolbar->linkButton('dashboard', 'COM_PHOCAMOSAIC_HOME')
            ->url('index.php?option=com_phocamosaic')
            ->icon('icon-home-2')
            ->buttonClass('btn btn-primary');
        }
        
        // Add Create Folder button
        $toolbar->standardButton('create-folder')
            ->text(Text::_('COM_PHOCAMOSAIC_CREATE_FOLDER'))
            ->icon('icon-folder')
            ->buttonClass('btn btn-success')
            ->onclick('if(window.explorerController){window.explorerController.showCreateFolderModal();}');
        
        // Add Delete Backups button
        $toolbar->standardButton('delete-backups')
            ->text(Text::_('COM_PHOCAMOSAIC_DELETE_BACKUPS'))
            ->icon('icon-delete')
            ->buttonClass('btn btn-danger')
            ->onclick('if(window.explorerController){window.explorerController.showDeleteBackupsModal();}');
        

        // Add the preferences button
        if (($user->authorise('core.admin', 'com_media') || $user->authorise('core.options', 'com_media')) && $tmpl !== 'component') {
            $toolbar->preferences('com_phocamosaic');
            $toolbar->divider();
        }

        if ($tmpl !== 'component') {
            $toolbar->help('screen.phocamosaic', true);
        }
    }
}
