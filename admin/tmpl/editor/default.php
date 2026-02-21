<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Language\Text;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Session\Session;
use Joomla\CMS\Component\ComponentHelper;

// Load language
$lang = Factory::getLanguage();
$lang->load('com_phocamosaic', JPATH_ADMINISTRATOR);

// Load assets manually
$wa = $this->document->getWebAssetManager();

// Register and use editor CSS
$wa->registerStyle(
    'com_phocamosaic.editor',
    'media/com_phocamosaic/css/editor.css'
);
$wa->useStyle('com_phocamosaic.editor');

// Register and use editor JavaScript
$wa->registerAndUseScript(
    'com_phocamosaic.enhanced-editor',
    Uri::root() . 'media/com_phocamosaic/js/enhanced-editor.js',
    [],
    ['defer' => true]
);

// Pass translations to JavaScript
$this->document->addScriptOptions('com_phocamosaic.translations', [
    'TOOL_OPTIONS' => Text::_('COM_PHOCAMOSAIC_TOOL_OPTIONS'),
    'SELECT_TOOL' => Text::_('COM_PHOCAMOSAIC_SELECT_TOOL'),
    'INTENSITY' => Text::_('COM_PHOCAMOSAIC_INTENSITY'),
    'APPLY' => Text::_('JAPPLY'),
    'CANCEL' => Text::_('JCANCEL'),
    'RESET_CHANGES' => Text::_('COM_PHOCAMOSAIC_RESET_CHANGES'),
    'RESET_CONFIRM' => Text::_('COM_PHOCAMOSAIC_RESET_CONFIRM'),
    'RESET' => Text::_('COM_PHOCAMOSAIC_RESET'),
    'IMAGE_RESET' => Text::_('COM_PHOCAMOSAIC_IMAGE_RESET'),
    'FILTER_APPLIED' => Text::_('COM_PHOCAMOSAIC_FILTER_APPLIED'),
    'ROTATION_ANGLE' => Text::_('COM_PHOCAMOSAIC_ROTATION_ANGLE'),
    'STRAIGHTEN' => Text::_('COM_PHOCAMOSAIC_STRAIGHTEN'),
    'STRAIGHTEN_APPLIED' => Text::_('COM_PHOCAMOSAIC_STRAIGHTEN_APPLIED'),
    'CROP' => Text::_('COM_PHOCAMOSAIC_CROP'),
    'APPLY_CROP' => Text::_('COM_PHOCAMOSAIC_APPLY_CROP'),
    'RESIZE_IMAGE' => Text::_('COM_PHOCAMOSAIC_RESIZE_IMAGE'),
    'WIDTH' => Text::_('COM_PHOCAMOSAIC_WIDTH'),
    'HEIGHT' => Text::_('COM_PHOCAMOSAIC_HEIGHT'),
    'MAINTAIN_ASPECT' => Text::_('COM_PHOCAMOSAIC_MAINTAIN_ASPECT'),
    'RESIZE' => Text::_('COM_PHOCAMOSAIC_RESIZE'),
    'SAVE_AS' => Text::_('COM_PHOCAMOSAIC_SAVE_AS'),
    'FILENAME' => Text::_('COM_PHOCAMOSAIC_FILENAME'),
    'FORMAT' => Text::_('COM_PHOCAMOSAIC_FORMAT'),
    'QUALITY' => Text::_('COM_PHOCAMOSAIC_QUALITY'),
    'SAVE' => Text::_('JSAVE'),
    'PRESET_NAME' => Text::_('COM_PHOCAMOSAIC_PRESET_NAME'),
    'SAVE_PRESET' => Text::_('COM_PHOCAMOSAIC_SAVE_PRESET'),
    'LOAD_PRESET' => Text::_('COM_PHOCAMOSAIC_LOAD_PRESET'),
    'SELECT_PRESET' => Text::_('COM_PHOCAMOSAIC_SELECT_PRESET'),
    'LOAD' => Text::_('COM_PHOCAMOSAIC_LOAD'),
    'DISCARD_CHANGES' => Text::_('COM_PHOCAMOSAIC_DISCARD_CHANGES'),
    'DISCARD_CONFIRM' => Text::_('COM_PHOCAMOSAIC_DISCARD_CONFIRM'),
    'YES_DISCARD' => Text::_('COM_PHOCAMOSAIC_YES_DISCARD'),
    'NO' => Text::_('JNO'),
    'IMAGE_SAVED' => Text::_('COM_PHOCAMOSAIC_IMAGE_SAVED'),
    'RELOADING' => Text::_('COM_PHOCAMOSAIC_RELOADING'),
    'LOADING' => Text::_('COM_PHOCAMOSAIC_LOADING'),
    'ENTER_FILENAME' => Text::_('COM_PHOCAMOSAIC_ENTER_FILENAME'),
    'ENTER_PRESET_NAME' => Text::_('COM_PHOCAMOSAIC_ENTER_PRESET_NAME'),
    'PRESET_SAVED' => Text::_('COM_PHOCAMOSAIC_PRESET_SAVED'),
    'NO_PRESETS' => Text::_('COM_PHOCAMOSAIC_NO_PRESETS'),
    'PRESET_LOADED' => Text::_('COM_PHOCAMOSAIC_PRESET_LOADED'),
    'FAILED_SAVE' => Text::_('COM_PHOCAMOSAIC_FAILED_SAVE'),
    'FAILED_LOAD' => Text::_('COM_PHOCAMOSAIC_FAILED_LOAD'),
    // Advanced Filter Controls
    'TINT_COLOR' => Text::_('COM_PHOCAMOSAIC_TINT_COLOR'),
    'FILTER_COLOR' => Text::_('COM_PHOCAMOSAIC_FILTER_COLOR'),
    'FOCAL_SIZE' => Text::_('COM_PHOCAMOSAIC_FOCAL_SIZE'),
    'FEATHER' => Text::_('COM_PHOCAMOSAIC_FEATHER'),
    'SHADE' => Text::_('COM_PHOCAMOSAIC_SHADE'),
    'BLUR_EDGES' => Text::_('COM_PHOCAMOSAIC_BLUR_EDGES'),
    'GRAIN' => Text::_('COM_PHOCAMOSAIC_GRAIN'),
    'RADIUS' => Text::_('COM_PHOCAMOSAIC_RADIUS'),
    'STRENGTH' => Text::_('COM_PHOCAMOSAIC_STRENGTH'),
    'BLOOM' => Text::_('COM_PHOCAMOSAIC_BLOOM'),
    'BRIGHTNESS' => Text::_('COM_PHOCAMOSAIC_BRIGHTNESS'),
    'SHADOW_COLOR' => Text::_('COM_PHOCAMOSAIC_SHADOW_COLOR'),
    'HIGHLIGHT_COLOR' => Text::_('COM_PHOCAMOSAIC_HIGHLIGHT_COLOR'),
    'CONTRAST' => Text::_('COM_PHOCAMOSAIC_CONTRAST'),
    'SIZE' => Text::_('COM_PHOCAMOSAIC_SIZE'),
    'VIGNETTE_COLOR' => Text::_('COM_PHOCAMOSAIC_VIGNETTE_COLOR'),
    'ZOOMINESS' => Text::_('COM_PHOCAMOSAIC_ZOOMINESS'),
    'EDGE_HARDNESS' => Text::_('COM_PHOCAMOSAIC_EDGE_HARDNESS'),
    'NEON_COLOR' => Text::_('COM_PHOCAMOSAIC_NEON_COLOR'),
    'COLOR_BRUSH' => Text::_('COM_PHOCAMOSAIC_COLOR_BRUSH'),
    'DOT_DENSITY' => Text::_('COM_PHOCAMOSAIC_DOT_DENSITY'),
]);

// Pass component configuration to JavaScript
$params = ComponentHelper::getParams('com_phocamosaic');
$this->document->addScriptOptions('com_phocamosaic.config', [
    'presetStorage' => $params->get('preset_storage', 'localStorage'),
    'storageMethod' => $params->get('storage_method', 'json'),
]);

$token = Session::getFormToken();
$baseUrl = rtrim(Uri::root(), '/') . '/';
$imagePath = $this->imagePath ?? '';
?>

<div class="mosaic-studio">
    <div class="image-info">
            <span id="image-filename"><?php echo htmlspecialchars(basename($imagePath)); ?></span>
            <span id="image-dimensions"></span>
            <span id="image-filename-path" class="image-filename-path"><?php echo htmlspecialchars($imagePath); ?></span>
        </div>
    <div class="studio-header">
        
        <div class="studio-actions">
            <button type="button" id="save-btn">
                <?php echo Text::_('COM_PHOCAMOSAIC_SAVE'); ?>
            </button>
            <button type="button" id="save-as-btn">
                <?php echo Text::_('COM_PHOCAMOSAIC_SAVE_AS'); ?>
            </button>
            <button type="button" id="undo-btn" disabled>
                <?php echo Text::_('COM_PHOCAMOSAIC_UNDO'); ?>
            </button>
            <button type="button" id="redo-btn" disabled>
                <?php echo Text::_('COM_PHOCAMOSAIC_REDO'); ?>
            </button>
            <button type="button" id="reset-btn">
                <?php echo Text::_('COM_PHOCAMOSAIC_RESET'); ?>
            </button>
            <button type="button" class="" id="save-preset-btn">
                <?php echo Text::_('COM_PHOCAMOSAIC_SAVE_PRESET'); ?>
            </button>
            <button type="button" class="" id="load-preset-btn">
                <?php echo Text::_('COM_PHOCAMOSAIC_LOAD_PRESET'); ?>
            </button>
            <button type="button" id="close-btn">
                <?php echo Text::_('COM_PHOCAMOSAIC_CLOSE'); ?>
            </button>
        </div>
    </div>

    <div class="studio-workspace">
        <div class="tool-sidebar" id="tool-sidebar">
            <input type="text" class="filter-search" id="filter-search" placeholder="Search filters...">
            
            <div class="tool-group">
                <h3 class="tool-group-title tool-group-edit"><?php echo Text::_('COM_PHOCAMOSAIC_EDIT'); ?></h3>
                <button type="button" class="tool-btn" data-tool="rotate-left">
                    <?php echo Text::_('COM_PHOCAMOSAIC_ROTATE_LEFT'); ?>
                </button>
                <button type="button" class="tool-btn" data-tool="rotate-right">
                    <?php echo Text::_('COM_PHOCAMOSAIC_ROTATE_RIGHT'); ?>
                </button>
                <button type="button" class="tool-btn" data-tool="mirror">
                    <?php echo Text::_('COM_PHOCAMOSAIC_MIRROR'); ?>
                </button>
                <button type="button" class="tool-btn" data-tool="flip">
                    <?php echo Text::_('COM_PHOCAMOSAIC_FLIP'); ?>
                </button>
                <button type="button" class="tool-btn" data-tool="resize">
                    <?php echo Text::_('COM_PHOCAMOSAIC_RESIZE'); ?>
                </button>
                <button type="button" class="tool-btn" data-tool="crop">
                    <?php echo Text::_('COM_PHOCAMOSAIC_CROP'); ?>
                </button>
                <button type="button" class="tool-btn" data-tool="straighten">
                    <?php echo Text::_('COM_PHOCAMOSAIC_STRAIGHTEN'); ?>
                </button>
            </div>
            
            <div class="tool-group">
                <h3 class="tool-group-title tool-group-filter"><?php echo Text::_('COM_PHOCAMOSAIC_BASIC_FIXES'); ?></h3>
                <button type="button" class="tool-btn" data-filter="I'm Feeling Lucky">
                    <?php echo Text::_('COM_PHOCAMOSAIC_FEELING_LUCKY'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Autocontrast">
                    <?php echo Text::_('COM_PHOCAMOSAIC_AUTOCONTRAST'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Autocolor">
                    <?php echo Text::_('COM_PHOCAMOSAIC_AUTOCOLOR'); ?>
                </button>
            </div>

            <div class="tool-group">
                <h3 class="tool-group-title tool-group-filter"><?php echo Text::_('COM_PHOCAMOSAIC_LIGHTING_COLOR'); ?></h3>
                <button type="button" class="tool-btn" data-filter="Fill Light">
                    <?php echo Text::_('COM_PHOCAMOSAIC_FILL_LIGHT'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Highlights">
                    <?php echo Text::_('COM_PHOCAMOSAIC_HIGHLIGHTS'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Shadows">
                    <?php echo Text::_('COM_PHOCAMOSAIC_SHADOWS'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Color Temperature">
                    <?php echo Text::_('COM_PHOCAMOSAIC_COLOR_TEMP'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Brightness">
                    <?php echo Text::_('COM_PHOCAMOSAIC_BRIGHTNESS'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Contrast">
                    <?php echo Text::_('COM_PHOCAMOSAIC_CONTRAST'); ?>
                </button>
            </div>

            <div class="tool-group">
                <h3 class="tool-group-title tool-group-filter"><?php echo Text::_('COM_PHOCAMOSAIC_FILTER_A_BASIC'); ?></h3>
                <button type="button" class="tool-btn" data-filter="Sharpen">
                    <?php echo Text::_('COM_PHOCAMOSAIC_SHARPEN'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Sepia">
                    <?php echo Text::_('COM_PHOCAMOSAIC_SEPIA'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="B&W">
                    <?php echo Text::_('COM_PHOCAMOSAIC_BW'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Warmify">
                    <?php echo Text::_('COM_PHOCAMOSAIC_WARMIFY'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Film Grain">
                    <?php echo Text::_('COM_PHOCAMOSAIC_FILM_GRAIN'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Tint">
                    <?php echo Text::_('COM_PHOCAMOSAIC_TINT'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Saturation">
                    <?php echo Text::_('COM_PHOCAMOSAIC_SATURATION'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Soft Focus">
                    <?php echo Text::_('COM_PHOCAMOSAIC_SOFT_FOCUS'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Glow">
                    <?php echo Text::_('COM_PHOCAMOSAIC_GLOW'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Filtered B&W">
                    <?php echo Text::_('COM_PHOCAMOSAIC_FILTERED_BW'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Focal B&W">
                    <?php echo Text::_('COM_PHOCAMOSAIC_FOCAL_BW'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Graduated Tint">
                    <?php echo Text::_('COM_PHOCAMOSAIC_GRADUATED_TINT'); ?>
                </button>
            </div>

            <div class="tool-group">
                <h3 class="tool-group-title tool-group-filter"><?php echo Text::_('COM_PHOCAMOSAIC_FILTER_B_CREATIVE'); ?></h3>
                <button type="button" class="tool-btn" data-filter="Infrared">
                    <?php echo Text::_('COM_PHOCAMOSAIC_INFRARED'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Lomo-ish">
                    <?php echo Text::_('COM_PHOCAMOSAIC_LOMO'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Holga-ish">
                    <?php echo Text::_('COM_PHOCAMOSAIC_HOLGA'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="HDR-ish">
                    <?php echo Text::_('COM_PHOCAMOSAIC_HDR_SCAPE'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Cinemascope">
                    <?php echo Text::_('COM_PHOCAMOSAIC_CINEMASCOPE'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Orton-ish">
                    <?php echo Text::_('COM_PHOCAMOSAIC_ORTON'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="1960's">
                    <?php echo Text::_('COM_PHOCAMOSAIC_1960S'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Invert Colors">
                    <?php echo Text::_('COM_PHOCAMOSAIC_INVERT_COLORS'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Heat Map">
                    <?php echo Text::_('COM_PHOCAMOSAIC_HEAT_MAP'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Cross Process">
                    <?php echo Text::_('COM_PHOCAMOSAIC_CROSS_PROCESS'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Posterize">
                    <?php echo Text::_('COM_PHOCAMOSAIC_POSTERIZE'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Duo Tone">
                    <?php echo Text::_('COM_PHOCAMOSAIC_DUO_TONE'); ?>
                </button>
            </div>

            <div class="tool-group">
                <h3 class="tool-group-title tool-group-filter"><?php echo Text::_('COM_PHOCAMOSAIC_FILTER_C_ADVANCED'); ?></h3>
                <button type="button" class="tool-btn" data-filter="Boost">
                    <?php echo Text::_('COM_PHOCAMOSAIC_BOOST'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Soften">
                    <?php echo Text::_('COM_PHOCAMOSAIC_SOFTEN'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Vignette">
                    <?php echo Text::_('COM_PHOCAMOSAIC_VIGNETTE'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Pixelate">
                    <?php echo Text::_('COM_PHOCAMOSAIC_PIXELATE'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Focal Zoom">
                    <?php echo Text::_('COM_PHOCAMOSAIC_FOCAL_ZOOM'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Pencil Sketch">
                    <?php echo Text::_('COM_PHOCAMOSAIC_PENCIL_SKETCH'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Neon">
                    <?php echo Text::_('COM_PHOCAMOSAIC_NEON'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Comic Book">
                    <?php echo Text::_('COM_PHOCAMOSAIC_COMIC_BOOK'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Tilt Shift">
                    <?php echo Text::_('COM_PHOCAMOSAIC_TILT_SHIFT'); ?>
                </button>
            </div>

            <div class="tool-group">
                <h3 class="tool-group-title tool-group-filter"><?php echo Text::_('COM_PHOCAMOSAIC_INSTAGRAM_STYLE'); ?></h3>
                <button type="button" class="tool-btn" data-filter="Valencia">
                    <?php echo Text::_('COM_PHOCAMOSAIC_VALENCIA'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Nashville">
                    <?php echo Text::_('COM_PHOCAMOSAIC_NASHVILLE'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Clarendon">
                    <?php echo Text::_('COM_PHOCAMOSAIC_CLARENDON'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Gingham">
                    <?php echo Text::_('COM_PHOCAMOSAIC_GINGHAM'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Juno">
                    <?php echo Text::_('COM_PHOCAMOSAIC_JUNO'); ?>
                </button>
                <button type="button" class="tool-btn" data-filter="Lark">
                    <?php echo Text::_('COM_PHOCAMOSAIC_LARK'); ?>
                </button>
            </div>

        </div>

        <div class="canvas-area">
            <canvas id="image-canvas"></canvas>
        </div>

        <div class="tool-panel" id="tool-panel">
            <h3><?php echo Text::_('COM_PHOCAMOSAIC_TOOL_OPTIONS'); ?></h3>
            <p style="color: var(--mosaic-text-secondary); font-size: 0.875rem;"><?php echo Text::_('COM_PHOCAMOSAIC_SELECT_TOOL'); ?></p>
        </div>
    </div>

    <!-- Mobile hamburger buttons -->
    <button type="button" class="mobile-filter-toggle" id="mobile-filter-toggle" aria-label="<?php echo Text::_('COM_PHOCAMOSAIC_TOGGLE_FILTERS'); ?>">
        🎨
    </button>
    <button type="button" class="mobile-tool-toggle" id="mobile-tool-toggle" aria-label="<?php echo Text::_('COM_PHOCAMOSAIC_TOGGLE_TOOLS'); ?>">
        🛠️
    </button>

    <!-- Overlay for mobile sidebars -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
</div>

<input type="hidden" id="csrf-token" value="<?php echo $token; ?>">
<input type="hidden" id="image-path" value="<?php echo htmlspecialchars($imagePath); ?>">
<input type="hidden" id="base-url" value="<?php echo $baseUrl; ?>">

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
