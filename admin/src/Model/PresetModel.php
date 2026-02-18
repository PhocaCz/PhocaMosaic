<?php
/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

declare(strict_types=1);

namespace Phoca\Component\PhocaMosaic\Administrator\Model;

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\MVC\Model\BaseDatabaseModel;
use Joomla\Database\DatabaseInterface;

/**
 * Preset Model
 *
 * @since  6.0.0
 */
class PresetModel extends BaseDatabaseModel
{
    /**
     * Save a preset to database
     *
     * @param   string  $name     Preset name
     * @param   array   $filters  Array of filters with name and intensity
     *
     * @return  int  The ID of the saved preset
     *
     * @throws  \Exception
     *
     * @since   6.0.0
     */
    public function savePreset(string $name, array $filters): int
    {
        $db = $this->getDatabase();
        $user = Factory::getApplication()->getIdentity();
        $date = Factory::getDate()->toSql();
        
        // Check if preset with this name already exists for this user
        $query = $db->getQuery(true)
            ->select('id')
            ->from($db->quoteName('#__phocamosaic_presets'))
            ->where($db->quoteName('name') . ' = :name')
            ->where($db->quoteName('created_by') . ' = :user_id')
            ->bind(':name', $name)
            ->bind(':user_id', $user->id, \Joomla\Database\ParameterType::INTEGER);
        
        $db->setQuery($query);
        $existingId = $db->loadResult();
        
        $filtersJson = json_encode($filters);
        
        if ($existingId) {
            // Update existing preset
            $query = $db->getQuery(true)
                ->update($db->quoteName('#__phocamosaic_presets'))
                ->set($db->quoteName('filters') . ' = :filters')
                ->set($db->quoteName('modified') . ' = :modified')
                ->where($db->quoteName('id') . ' = :id')
                ->bind(':filters', $filtersJson)
                ->bind(':modified', $date)
                ->bind(':id', $existingId, \Joomla\Database\ParameterType::INTEGER);
            
            $db->setQuery($query);
            $db->execute();
            
            return (int) $existingId;
        } else {
            // Insert new preset
            $query = $db->getQuery(true)
                ->insert($db->quoteName('#__phocamosaic_presets'))
                ->columns([
                    $db->quoteName('name'),
                    $db->quoteName('filters'),
                    $db->quoteName('created_by'),
                    $db->quoteName('created'),
                    $db->quoteName('modified'),
                    $db->quoteName('published')
                ])
                ->values(':name, :filters, :user_id, :created, :modified, 1')
                ->bind(':name', $name)
                ->bind(':filters', $filtersJson)
                ->bind(':user_id', $user->id, \Joomla\Database\ParameterType::INTEGER)
                ->bind(':created', $date)
                ->bind(':modified', $date);
            
            $db->setQuery($query);
            $db->execute();
            
            return (int) $db->insertid();
        }
    }
    
    /**
     * Load all presets for current user
     *
     * @return  array  Array of presets
     *
     * @since   6.0.0
     */
    public function loadPresets(): array
    {
        $db = $this->getDatabase();
        $user = Factory::getApplication()->getIdentity();
        
        $query = $db->getQuery(true)
            ->select([
                $db->quoteName('id'),
                $db->quoteName('name'),
                $db->quoteName('filters'),
                $db->quoteName('created'),
                $db->quoteName('modified')
            ])
            ->from($db->quoteName('#__phocamosaic_presets'))
            ->where($db->quoteName('created_by') . ' = :user_id')
            ->where($db->quoteName('published') . ' = 1')
            ->order($db->quoteName('name') . ' ASC')
            ->bind(':user_id', $user->id, \Joomla\Database\ParameterType::INTEGER);
        
        $db->setQuery($query);
        $results = $db->loadObjectList();
        
        // Decode filters JSON - the filters column contains a JSON string
        $presets = [];
        foreach ($results as $result) {
            $filters = json_decode($result->filters, true);
            
            // If filters is still a string (double-encoded), decode again
            if (is_string($filters)) {
                $filters = json_decode($filters, true);
            }
            
            $presets[] = [
                'id' => (int) $result->id,
                'name' => $result->name,
                'filters' => is_array($filters) ? $filters : [],
                'created' => $result->created,
                'modified' => $result->modified
            ];
        }
        
        return $presets;
    }
    
    /**
     * Delete a preset
     *
     * @param   int  $id  Preset ID
     *
     * @return  bool  True on success
     *
     * @throws  \Exception
     *
     * @since   6.0.0
     */
    public function deletePreset(int $id): bool
    {
        $db = $this->getDatabase();
        $user = Factory::getApplication()->getIdentity();
        
        // Verify ownership before deleting
        $query = $db->getQuery(true)
            ->delete($db->quoteName('#__phocamosaic_presets'))
            ->where($db->quoteName('id') . ' = :id')
            ->where($db->quoteName('created_by') . ' = :user_id')
            ->bind(':id', $id, \Joomla\Database\ParameterType::INTEGER)
            ->bind(':user_id', $user->id, \Joomla\Database\ParameterType::INTEGER);
        
        $db->setQuery($query);
        $db->execute();
        
        return $db->getAffectedRows() > 0;
    }
}
