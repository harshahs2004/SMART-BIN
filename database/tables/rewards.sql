--
-- Table structure for table `rewards`
--

CREATE TABLE IF NOT EXISTS `rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points_earned` int DEFAULT '0',
  `points_redeemed` int DEFAULT '0',
  `withdrawal_status` enum('Pending','Completed') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_email` (`user_email`),
  CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`user_email`) REFERENCES `users` (`email`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rewards`
--

INSERT INTO `rewards` (`id`, `user_email`, `points_earned`, `points_redeemed`, `withdrawal_status`, `requested_at`) VALUES
(1, 'john.doe@example.com', 10, 0, 'Pending', '2025-11-16 00:00:00'),
(2, 'jane.smith@example.com', 0, 50, 'Completed', '2025-11-16 00:00:00');
