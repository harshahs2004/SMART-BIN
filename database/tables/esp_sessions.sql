--
-- Table structure for table `esp_sessions`
--

CREATE TABLE IF NOT EXISTS `esp_sessions` (
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bin_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_weight` float DEFAULT NULL,
  `max_weight` float DEFAULT NULL,
  `start_time` bigint DEFAULT NULL,
  `end_time` bigint DEFAULT NULL,
  `types` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','claimed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `claimed_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `esp_sessions`
--

INSERT INTO `esp_sessions` (`session_id`, `bin_id`, `total_weight`, `max_weight`, `start_time`, `end_time`, `types`, `status`, `claimed_by`, `created_at`) VALUES
('Sxyz123', 'BIN_007', 1.23, 1.5, 1736942000, 1736942200, 'metal,wet', 'pending', NULL, '2025-11-16 00:00:00');
