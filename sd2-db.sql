-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Mar 21, 2025 at 01:59 AM
-- Server version: 8.2.0
-- PHP Version: 8.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sd2-db`
--

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `event_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `event_date` date NOT NULL,
  `event_time` time NOT NULL,
  `capacity` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`event_id`, `title`, `description`, `event_date`, `event_time`, `capacity`, `created_at`, `updated_at`) VALUES
(1, 'Yoga Session', 'Join us for a relaxing yoga session to refresh your mind and body.', '2025-04-15', '10:00:00', 50, '2025-03-21 01:50:17', '2025-03-21 01:50:17'),
(2, 'Cooking Class', 'Learn how to cook delicious Italian dishes with our expert chefs.', '2025-05-01', '18:00:00', 30, '2025-03-21 01:50:17', '2025-03-21 01:50:17'),
(3, 'Music Concert', 'Enjoy a live performance by local bands under the stars.', '2025-06-10', '19:00:00', 200, '2025-03-21 01:50:17', '2025-03-21 01:50:17');

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `registration_id` int NOT NULL,
  `user_id` int NOT NULL,
  `event_id` int NOT NULL,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `registrations`
--

INSERT INTO `registrations` (`registration_id`, `user_id`, `event_id`, `registration_date`) VALUES
(1, 1, 1, '2025-03-21 01:50:18'),
(2, 1, 2, '2025-03-21 01:50:18'),
(3, 3, 1, '2025-03-21 01:50:18'),
(4, 3, 3, '2025-03-21 01:50:18');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int NOT NULL,
  `user_id` int NOT NULL,
  `event_id` int NOT NULL,
  `rating` int DEFAULT NULL,
  `review_text` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `user_id`, `event_id`, `rating`, `review_text`, `created_at`) VALUES
(1, 1, 1, 5, 'Amazing event! The yoga session was very relaxing and helpful.', '2025-03-21 01:50:18'),
(2, 3, 2, 4, 'Great cooking class! Learned some wonderful recipes.', '2025-03-21 01:50:18'),
(3, 1, 3, 4, 'Fantastic concert with great local bands! Would attend again.', '2025-03-21 01:50:18');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'John', 'Doe', 'john.doe@example.com', 'password123', 'user', '2025-03-21 01:50:17', '2025-03-21 01:50:17'),
(2, 'Jane', 'Smith', 'jane.smith@example.com', 'securepass456', 'admin', '2025-03-21 01:50:17', '2025-03-21 01:50:17'),
(3, 'Bob', 'Johnson', 'bob.johnson@example.com', 'mypassword789', 'user', '2025-03-21 01:50:17', '2025-03-21 01:50:17');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`event_id`);

--
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`registration_id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`event_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `event_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `registration_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
