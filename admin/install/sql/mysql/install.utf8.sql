--
-- Table structure for image metadata
-- Used when storage_method config option is set to 'database'
-- Alternative to JSON sidecar files for storing image edit history
--

-- CREATE TABLE IF NOT EXISTS `#__phocamosaic_metadata` (
--  `id` int unsigned NOT NULL AUTO_INCREMENT,
--  `image_path` varchar(500) NOT NULL,
--  `original_size` bigint unsigned NOT NULL DEFAULT 0,
--  `original_width` int unsigned NOT NULL DEFAULT 0,
--  `original_height` int unsigned NOT NULL DEFAULT 0,
--  `edit_history` mediumtext COMMENT 'JSON array of edit operations applied to the image',
--  `created` datetime NOT NULL,
--  `modified` datetime NOT NULL,
--  PRIMARY KEY (`id`),
--  UNIQUE KEY `idx_image_path` (`image_path`(255))
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 DEFAULT COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for filter presets
-- Used when preset_storage config option is set to 'database'
-- Stores user-created filter presets (each user has their own presets)
--

CREATE TABLE IF NOT EXISTS `#__phocamosaic_presets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `filters` text NOT NULL COMMENT 'JSON array of filters with name and intensity',
  `created_by` int unsigned NOT NULL DEFAULT 0,
  `created` datetime NOT NULL,
  `modified` datetime NOT NULL,
  `published` tinyint NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`(191)),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_published` (`published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 DEFAULT COLLATE=utf8mb4_unicode_ci;
