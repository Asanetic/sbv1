-- phpMyAdmin SQL Dump
-- version 4.3.11
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Aug 29, 2026 at 01:59 PM
-- Server version: 5.6.24
-- PHP Version: 5.6.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `imsv1`
--

-- --------------------------------------------------------

--
-- Table structure for table `income_plan`
--

CREATE TABLE IF NOT EXISTS `income_plan` (
  `primkey` int(11) NOT NULL,
  `income_plan_id` varchar(100) NOT NULL,
  `plan_month` text NOT NULL,
  `income_source_id` varchar(100) NOT NULL,
  `expected_customers` decimal(12,2) DEFAULT '0.00',
  `average_deal_amount` decimal(15,2) DEFAULT '0.00',
  `expected_amt` text NOT NULL,
  `status` varchar(50) DEFAULT 'planned',
  `notes` text,
  `reg_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `hive_site_id` varchar(500) NOT NULL,
  `hive_site_name` varchar(500) NOT NULL,
  `actual_earnings` varchar(255) DEFAULT NULL,
  `variance` varchar(255) DEFAULT NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `income_plan`
--

INSERT INTO `income_plan` (`primkey`, `income_plan_id`, `plan_month`, `income_source_id`, `expected_customers`, `average_deal_amount`, `expected_amt`, `status`, `notes`, `reg_date`, `hive_site_id`, `hive_site_name`, `actual_earnings`, `variance`) VALUES
(1, 'XDZMC9O', 'Aug - 2026', 'WB3R2K7', '5.00', '25000.00', '100000', '', '', '2026-08-29 09:52:00', 'LLRR0ZKOXRTCOHN_2024-12-28-07-45-56-pm', 'Superadmin', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `income_sources`
--

CREATE TABLE IF NOT EXISTS `income_sources` (
  `primkey` int(11) NOT NULL,
  `income_source_id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `income_type` varchar(50) DEFAULT 'one_off',
  `niche` varchar(150) DEFAULT NULL,
  `default_amount` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'KES',
  `status` varchar(50) DEFAULT 'active',
  `reg_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `hive_site_id` varchar(500) NOT NULL,
  `hive_site_name` varchar(500) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `income_sources`
--

INSERT INTO `income_sources` (`primkey`, `income_source_id`, `name`, `description`, `income_type`, `niche`, `default_amount`, `currency`, `status`, `reg_date`, `hive_site_id`, `hive_site_name`) VALUES
(1, 'WB3R2K7', 'Web design', '', 'Web design', 'Dental web design', '25000.00', '', '', '2026-08-29 09:33:00', 'LLRR0ZKOXRTCOHN_2024-12-28-07-45-56-pm', 'Superadmin'),
(2, '00XSQRT', 'POS SaaS', '', 'SAAS', 'Retail SAAS', '2500.00', '', '', '2026-08-29 09:33:00', 'LLRR0ZKOXRTCOHN_2024-12-28-07-45-56-pm', 'Superadmin'),
(3, '9YPIL5J', 'ISP SaaS', '', 'SAAS', 'ISP SAAS', '2500.00', '', '', '2026-08-29 09:33:00', 'LLRR0ZKOXRTCOHN_2024-12-28-07-45-56-pm', 'Superadmin'),
(4, '9PN2MXZ', 'Project management SaaS', '', 'SAAS', 'Real estate SAAS', '5700.00', '', '', '2026-08-29 09:33:00', 'LLRR0ZKOXRTCOHN_2024-12-28-07-45-56-pm', 'Superadmin');

-- --------------------------------------------------------

--
-- Table structure for table `payment_history`
--

CREATE TABLE IF NOT EXISTS `payment_history` (
  `primkey` int(11) NOT NULL,
  `payment_id` varchar(100) NOT NULL,
  `expected_income_id` varchar(100) DEFAULT NULL,
  `contact_id` varchar(100) DEFAULT NULL,
  `opportunity_id` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'KES',
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `description` text,
  `status` varchar(50) DEFAULT 'completed',
  `created_by` varchar(100) DEFAULT NULL,
  `reg_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `hive_site_id` varchar(500) NOT NULL,
  `hive_site_name` varchar(500) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `payment_history`
--

INSERT INTO `payment_history` (`primkey`, `payment_id`, `expected_income_id`, `contact_id`, `opportunity_id`, `amount`, `currency`, `payment_date`, `payment_method`, `payment_reference`, `description`, `status`, `created_by`, `reg_date`, `hive_site_id`, `hive_site_name`) VALUES
(1, '4AAJBMF', '02VOEB1', 'T01L77U', 'HOQCK4Q', '8000.00', '', '2026-08-29 10:33:00', '', '', '', '', '', '2026-08-29 10:33:00', 'LLRR0ZKOXRTCOHN_2024-12-28-07-45-56-pm', 'Superadmin'),
(2, 'DPQ2D59', 'YNX80G1', 'T01L77U', 'HOQCK4Q', '7000.00', '', '2026-08-29 10:46:00', '', '', '', '', '', '2026-08-29 10:46:00', 'LLRR0ZKOXRTCOHN_2024-12-28-07-45-56-pm', 'Superadmin');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `income_plan`
--
ALTER TABLE `income_plan`
  ADD PRIMARY KEY (`primkey`);

--
-- Indexes for table `income_sources`
--
ALTER TABLE `income_sources`
  ADD PRIMARY KEY (`primkey`);

--
-- Indexes for table `payment_history`
--
ALTER TABLE `payment_history`
  ADD PRIMARY KEY (`primkey`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `income_plan`
--
ALTER TABLE `income_plan`
  MODIFY `primkey` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `income_sources`
--
ALTER TABLE `income_sources`
  MODIFY `primkey` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `payment_history`
--
ALTER TABLE `payment_history`
  MODIFY `primkey` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=3;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
