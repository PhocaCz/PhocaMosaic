<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\Dispatcher;

defined('_JEXEC') or die;

use Joomla\CMS\Dispatcher\ComponentDispatcher;

/**
 * Component dispatcher class for Phoca Mosaic
 *
 * @since  6.0.0
 */
class Dispatcher extends ComponentDispatcher
{
    /**
     * The extension namespace
     *
     * @var    string
     *
     * @since  6.0.0
     */
    protected $namespace = 'Phoca\\Component\\PhocaMosaic';

    /**
     * Method to check component access permission
     *
     * @return  void
     *
     * @since   6.0.0
     */
    protected function checkAccess()
    {
        parent::checkAccess();

        // Check if user has access to component
        $user = $this->app->getIdentity();

        if (!$user->authorise('core.manage', 'com_phocamosaic')) {
            throw new \Exception($this->app->getLanguage()->_('JERROR_ALERTNOAUTHOR'), 403);
        }
    }
}
