--
-- Table structure for table `dumps`
--

CREATE TABLE IF NOT EXISTS `dumps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight` decimal(6,2) DEFAULT NULL,
  `qr_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dump_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_email` (`user_email`),
  CONSTRAINT `dumps_ibfk_1` FOREIGN KEY (`user_email`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dumps`
--

INSERT INTO `dumps` (`id`, `user_email`, `weight`, `qr_code`, `dump_time`) VALUES
(1, 'john.doe@example.com', '1.50', 'USER123456', '2025-11-16 00:00:00'),
(2, 'jane.smith@example.com', '0.75', 'USER654321', '2025-11-16 00:00:00');
