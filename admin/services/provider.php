<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

defined('_JEXEC') or die;

use Joomla\CMS\Dispatcher\ComponentDispatcherFactoryInterface;
use Joomla\CMS\Extension\ComponentInterface;
use Joomla\CMS\Extension\Service\Provider\ComponentDispatcherFactory;
use Joomla\CMS\Extension\Service\Provider\MVCFactory;
use Joomla\CMS\MVC\Factory\MVCFactoryInterface;
use Joomla\DI\Container;
use Joomla\DI\ServiceProviderInterface;
use Phoca\Component\PhocaMosaic\Administrator\Extension\PhocaMosaicComponent;
use Phoca\Component\PhocaMosaic\Administrator\Service\ImageProcessor;
use Phoca\Component\PhocaMosaic\Administrator\Service\PathSanitizer;

/**
 * Service provider for the Phocamosaic component
 *
 * @since  6.0.0
 */
return new class implements ServiceProviderInterface
{
    /**
     * Registers the service provider with a DI container.
     *
     * @param   Container  $container  The DI container.
     *
     * @return  void
     *
     * @since   6.0.0
     */
    public function register(Container $container): void
    {
        // Register MVC factory
        $container->registerServiceProvider(new MVCFactory('\\Phoca\\Component\\PhocaMosaic'));
        
        // Register dispatcher factory
        $container->registerServiceProvider(new ComponentDispatcherFactory('\\Phoca\\Component\\PhocaMosaic'));
        
        // Register custom services
        $container->set(ImageProcessor::class, function (Container $c) {
            return new ImageProcessor();
        });
        
        $container->set(PathSanitizer::class, function (Container $c) {
            return new PathSanitizer();
        });
        
        // Register component
        $container->set(
            ComponentInterface::class,
            function (Container $container) {
                $component = new PhocaMosaicComponent($container->get(ComponentDispatcherFactoryInterface::class));
                $component->setMVCFactory($container->get(MVCFactoryInterface::class));
                
                return $component;
            }
        );
    }
};
