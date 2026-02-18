<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\Extension;

defined('_JEXEC') or die;

use Joomla\CMS\Extension\BootableExtensionInterface;
use Joomla\CMS\Extension\MVCComponent;
use Joomla\CMS\HTML\HTMLRegistryAwareTrait;
use Joomla\CMS\Factory;
use Psr\Container\ContainerInterface;

/**
 * Component class for Phoca Mosaic
 *
 * @since  6.0.0
 */
class PhocaMosaicComponent extends MVCComponent implements BootableExtensionInterface
{
    use HTMLRegistryAwareTrait;

    /**
     * Booting the extension. This is the function to set up the environment of the extension like
     * registering new class loaders, etc.
     *
     * If required, some initial set up can be done from services of the container, eg.
     * registering HTML services.
     *
     * @param   ContainerInterface  $container  The container
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function boot(ContainerInterface $container): void
    {
        // Register web assets programmatically
        $this->registerWebAssets();
    }

    /**
     * Register web assets for the component
     *
     * @return  void
     *
     * @since   6.0.0
     */
    private function registerWebAssets(): void
    {
        try {
            $app = Factory::getApplication();
            
            // Only register if we have a document
            if (!$app->getDocument()) {
                return;
            }
            
            $wa = $app->getDocument()->getWebAssetManager();
            $wr = $wa->getRegistry();

            // Register styles
            $wr->addExtensionRegistryFile('com_phocamosaic');
            
            // Fallback: Register assets manually if registry file fails
            if (!$wr->exists('style', 'com_phocamosaic.mosaic-ui')) {
                $wr->add('style', new \Joomla\CMS\WebAsset\WebAssetItem(
                    'com_phocamosaic.mosaic-ui',
                    '../media/com_phocamosaic/css/mosaic-ui.css',
                    ['type' => 'style']
                ));
            }
            
            if (!$wr->exists('style', 'com_phocamosaic.explorer-css')) {
                $wr->add('style', new \Joomla\CMS\WebAsset\WebAssetItem(
                    'com_phocamosaic.explorer-css',
                    '../media/com_phocamosaic/css/explorer.css',
                    ['type' => 'style']
                ));
            }
            
            if (!$wr->exists('style', 'com_phocamosaic.editor-css')) {
                $wr->add('style', new \Joomla\CMS\WebAsset\WebAssetItem(
                    'com_phocamosaic.editor-css',
                    '../media/com_phocamosaic/css/editor.css',
                    ['type' => 'style']
                ));
            }
            
            // Register scripts
            if (!$wr->exists('script', 'com_phocamosaic.explorer')) {
                $wr->add('script', new \Joomla\CMS\WebAsset\WebAssetItem(
                    'com_phocamosaic.explorer',
                    '../media/com_phocamosaic/js/explorer.mjs',
                    ['type' => 'script', 'attributes' => ['type' => 'module']]
                ));
            }
            
            if (!$wr->exists('script', 'com_phocamosaic.editor')) {
                $wr->add('script', new \Joomla\CMS\WebAsset\WebAssetItem(
                    'com_phocamosaic.editor',
                    '../media/com_phocamosaic/js/enhanced-editor.js',
                    ['type' => 'script']
                ));
            }
            /*
            if (!$wr->exists('script', 'com_phocamosaic.mosaic-engine')) {
                $wr->add('script', new \Joomla\CMS\WebAsset\WebAssetItem(
                    'com_phocamosaic.mosaic-engine',
                    '../media/com_phocamosaic/js/mosaic-engine.mjs',
                    ['type' => 'script', 'attributes' => ['type' => 'module']]
                ));
            }*/

        } catch (\Exception $e) {
            // Silently fail if document not available
        }
    }
}
