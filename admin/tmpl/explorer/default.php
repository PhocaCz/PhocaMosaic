<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Session\Session;

$token = Session::getFormToken();
$params = ComponentHelper::getParams('com_phocamosaic');
$maxUploadSize = $params->get('max_upload_size', 5242880); // Default 5 MB in bytes
$maxUploadSizeMB = round($maxUploadSize / 1048576, 1); // Convert to MB for display

// Check if we're in editor mode (opened from editor plugin)
$app = $this->app ?? Factory::getApplication();
$input = $app->input;
$editorMode = $input->get('tmpl') === 'component' && $input->get('e_name', '') !== '';
$editorName = $input->get('e_name', '');

// Pass config to JavaScript
$this->document->addScriptOptions('com_phocamosaic.upload', [
    'maxUploadSize' => $maxUploadSize,
    'maxUploadSizeMB' => $maxUploadSizeMB
]);

$this->document->addScriptOptions('com_phocamosaic.editor', [
    'editorMode' => $editorMode,
    'editorName' => $editorName
]);
?>

<?php if ($input->get('tmpl') === 'component') : ?>
<div class="subhead noshadow mb-3">
    <?php echo $this->getDocument()->getToolbar('toolbar')->render(); ?>
</div>
<?php endif; ?>

<div class="mosaic-explorer">
    <div class="explorer-header">
        <div class="search-bar">
            <input type="text" 
                   id="image-search" 
                   class="form-control" 
                   placeholder="<?php echo Text::_('COM_PHOCAMOSAIC_SEARCH_IMAGES'); ?>"
                   aria-label="<?php echo Text::_('COM_PHOCAMOSAIC_SEARCH_IMAGES'); ?>">
        </div>
        <div class="mosaic-breadcrumb-bar">
            <nav aria-label="<?php echo Text::_('COM_PHOCAMOSAIC_BREADCRUMB'); ?>">
                <ol class="mosaic-breadcrumb" id="folder-breadcrumb">
                    <li class="mosaic-breadcrumb-item active"><?php echo Text::_('COM_PHOCAMOSAIC_ROOT'); ?></li>
                </ol>
            </nav>
        </div>
    </div>
    
    
    <div class="explorer-content">
        <div class="folder-tree">
            <div id="folder-tree-container"></div>
        </div>

        <div class="image-grid">
            <!-- Image Grid -->
            <div id="image-grid-container" class="grid-container">
                <div class="loading-indicator">
                    <span class="spinner-border" role="status"></span>
                    <span><?php echo Text::_('COM_PHOCAMOSAIC_LOADING'); ?></span>
                </div>
            </div>

            <!-- Upload Drop Zone -->
            <div id="upload-drop-zone" class="upload-drop-zone">
                <div class="upload-drop-content">
                    <div class="upload-icon">📤</div>
                    <h3><?php echo Text::_('COM_PHOCAMOSAIC_DROP_FILES_HERE'); ?></h3>
                    <p><?php echo Text::_('COM_PHOCAMOSAIC_OR'); ?></p>
                    <button type="button" class="btn btn-primary" id="select-files-btn">
                        <?php echo Text::_('COM_PHOCAMOSAIC_SELECT_FILES'); ?>
                    </button>
                    <p class="upload-hint">
                        <?php echo Text::_('COM_PHOCAMOSAIC_SUPPORTED_FORMATS'); ?>: JPG, PNG, GIF, WebP<br>
                        <?php echo Text::_('COM_PHOCAMOSAIC_MAX_SIZE'); ?>: <?php echo $maxUploadSizeMB; ?> MB
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Mobile folder toggle button -->
    <button type="button" class="mobile-folder-toggle" id="mobile-folder-toggle" aria-label="<?php echo Text::_('COM_PHOCAMOSAIC_TOGGLE_FOLDERS'); ?>">
        📁
    </button>

    <!-- Folder tree overlay for mobile -->
    <div class="folder-tree-overlay" id="folder-tree-overlay"></div>

    <!-- Hidden file input for upload -->
    <input type="file" id="file-upload-input" accept="image/*" multiple style="display: none;">


</div>

<input type="hidden" id="csrf-token" value="<?php echo $token; ?>">



<div class="ph-dashboard-sidebar">

        <div class="ph-card">
            <div class="ph-card-body"><?php echo  HTMLHelper::_('image', "media/com_phocamosaic/images/admin/logo-phoca-mosaic.svg", Text::_('COM_PHOCAMOSAIC'), ['class' => 'ph-logo-product'] ); ?></div>
        </div>

        <div class="ph-card">
            <div class="ph-card-header">
                <span class="icon-info-circle"></span>
                <?php echo Text::_('COM_PHOCAMOSAIC_INFO'); ?>
            </div>
            <div class="ph-card-body">
                <div class="ph-info-row mb-2">
                    <strong><?php echo Text::_('COM_PHOCAMOSAIC_VERSION'); ?>:</strong>
                    <?php echo $this->version; ?>
                </div>
                <div class="ph-info-row mb-2">
                    <strong><?php echo Text::_('COM_PHOCAMOSAIC_COPYRIGHT'); ?>:</strong>
                    <?php echo '© 2007 - '.  date("Y"). '<br>Jan Pavelka' ?>
                </div>
                <div class="ph-info-row mb-2">
                    <strong><?php echo Text::_('COM_PHOCAMOSAIC_LICENSE'); ?>:</strong>
                    <?php echo '<a href="http://www.gnu.org/licenses/gpl-2.0.html" target="_blank">GPLv2</a>' ?>
                </div>
                <div class="ph-info-row mb-2">
                    <strong><?php echo Text::_('COM_PHOCAMOSAIC_TRANSLATION'); ?>:</strong>
                    <?php echo Text::_( 'COM_PHOCAMOSAIC_TRANSLATION_LANGUAGE_TAG').'<br>'
.'<div>© 2007 - '.  date("Y"). ' '. Text::_('COM_PHOCAMOSAIC_TRANSLATER'). '</div>'
.'<div>'.Text::_('COM_PHOCAMOSAIC_TRANSLATION_SUPPORT_URL').'</div>' ?>
                </div>
                <hr>
                <div class="d-grid gap-2 ph-info-links">
                    <a href="https://www.phoca.cz/phocamosaic" target="_blank" class="">
                        <?php echo Text::_('COM_PHOCAMOSAIC'); ?>
                    </a>
                    <a href="https://www.phoca.cz/documentation/" target="_blank" class="">
                        <?php echo Text::_('COM_PHOCAMOSAIC_DOCUMENTATION'); ?>
                    </a>
                    <a href="https://www.phoca.cz" target="_blank" class="">
                        Phoca
                    </a>
                </div>
            </div>
        </div>

    </div>

<!-- Mosaic Dialog -->
<div id="mosaic-dialog-overlay" class="mosaic-dialog-overlay" style="display: none;">
    <div class="mosaic-dialog-box">
        <div class="mosaic-dialog-header">
            <h3 id="mosaic-dialog-title"></h3>
        </div>
        <div class="mosaic-dialog-body" id="mosaic-dialog-body"></div>
        <div class="mosaic-dialog-footer" id="mosaic-dialog-footer"></div>
    </div>
</div>
