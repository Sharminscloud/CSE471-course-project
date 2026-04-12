# 🏛️ Digital Queue Transparency & Smart Slot Allocation System for Public Services

A full-stack web application designed to modernize and digitize public service queue management. The system eliminates physical queuing by providing citizens with digital token generation, smart appointment scheduling, and real-time queue transparency — while equipping administrators with powerful tools for branch management, capacity control, and operational analytics.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Module 1 — Core Service & Queue Management](#-module-1--core-service--queue-management)
- [Module 2 — Real-Time Features & Notifications](#-module-2--real-time-features--notifications)
- [Module 3 — Analytics, Reporting & Transparency](#-module-3--analytics-reporting--transparency)
- [Project Info](#-project-info)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | JavaScript |
| Framework | MERN (MongoDB, Express, React, Node.js) |
| Styling | Tailwind CSS |
| Database | MongoDB Atlas |
| ORM | Mongoose |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📦 Module 1 — Core Service & Queue Management

### 1.1 Dynamic Service Configuration

Administrators can fully define and manage the catalogue of public services available through the system.

**Capabilities:**
- Create service categories such as Passport Renewal, New NID, and Medical Checkup.
- Define the average processing time for each service.
- Specify required documents and applicable service fees per service type.
- Set priority levels for services where applicable.
- Edit or update existing service configurations at any time.
- Link a single service to multiple branches simultaneously, with support for branch-specific customization such as different processing times or capacity limits per branch.

---

### 1.2 Intelligent Token Generation & Queue Allocation

Citizens can request a digital queue token without physically visiting the branch.

**Token Details Stored:**
- Unique digital token ID
- Selected service type
- Chosen branch
- Request timestamp
- Assigned queue position

**System Behaviour:**
- Automatically assigns a queue position using a smart allocation algorithm that considers branch capacity, service duration, and existing bookings.
- Validates the branch's daily capacity before confirming a token request.
- Prevents overbooking by rejecting token requests that would exceed the defined daily limit.
- Supports priority tokens where applicable (e.g., senior citizens, emergency cases).

---

### 1.3 Smart Slot Scheduling & Appointment Management

Citizens and administrators interact with a structured appointment booking system.

**Citizen Capabilities:**
- View slot availability through a dynamic calendar interface.
- Book, reschedule, or cancel appointment slots within defined policy limits.
- Each booking records: selected service, preferred date and time, and current booking status (Confirmed, Cancelled, or Rescheduled).

**Admin Capabilities:**
- Configure slot duration and define time intervals between appointments.
- Set maximum bookings per time block to prevent overcrowding.
- Define buffer time between consecutive services.
- Set system-level booking rules for optimized crowd control and fair allocation.
- Manage daily slot limits and overall availability.

**System Validations:**
- Prevents slot allocations from exceeding the defined capacity.
- Enforces all configured booking rules before confirming any appointment.

---

### 1.4 Smart Branch Management & Capacity Control

Administrators have full control over the lifecycle and operational configuration of service branches.

**Branch Data Stored:**
- Branch name
- Address / location
- Geo-coordinates (latitude and longitude)
- Working hours
- Branch status (Active, Inactive, or Maintenance)
- Number of active counters
- Daily slot capacity

**Admin Capabilities:**
- Create, view, update, deactivate, and delete branches.
- Search and filter the branch list by branch name and operational status.
- View essential operational details — working hours, active counters, capacity, and status — from a single monitoring view.

**Validation & Safety Rules:**
- Mandatory fields are validated; the system prevents saving incomplete branch configurations.
- When a branch is marked as Inactive or under Maintenance, new token requests and slot bookings for that branch are automatically blocked, and a clear notice is displayed to citizens.
- The system can compute maximum theoretical service capacity based on active counters and service processing time, and warns the admin if the configured capacity exceeds the calculated feasible limit.
- All admin actions related to branch status changes and capacity modifications are logged for audit purposes.

---

## ⚡ Module 2 — Real-Time Features & Notifications

### 2.1 Real-Time Waiting Time Estimation

The system provides citizens with continuously updated waiting time estimates.

**Calculation Factors:**
- Current queue length at the selected branch
- Average service processing time for the selected service
- Number of currently active counters
- Branch working hours

**Update Triggers:**
- A token's status changes (e.g., serving, completed, skipped)
- A counter becomes available or goes offline
- Working hours are modified by an admin

**Public Holiday API Integration:**
- The system integrates with a Public Holiday API to detect whether the selected booking date falls on a public holiday.
- If the date is a public holiday, slot booking is blocked before confirmation and a holiday notice is shown to the user.
- If the API is unavailable, a fallback behaviour is applied: either showing a temporary warning and blocking the booking, or allowing it with a visible advisory — based on the configured policy.
- All API failures and holiday blocks are logged for monitoring and reporting.

---

### 2.2 Real-Time Queue Updates

Live queue changes are broadcast to all connected users without requiring a page refresh.

**Implementation:**
- Uses WebSocket technology or a service such as Pusher API for real-time event broadcasting.
- Whenever a token status changes, the citizen's queue dashboard and their current waiting position update instantly.
- Admins and counter staff see live queue movement reflected in their dashboards.

---

### 2.3 Queue Alert & Slot Reminder Notifications

The system proactively notifies citizens about their upcoming queue turns and appointments.

**Notification Triggers:**
- When a user's queue token is approaching (configurable threshold, e.g., 3 tokens ahead).
- Before a scheduled appointment slot (configurable reminder window).

**Delivery Channels:**
- SMS notifications via an integrated SMS API.
- Email notifications via an integrated Email API.

**Logging:**
- All sent notifications are logged in the system, recording the recipient, notification type, delivery channel, and timestamp.

---

## 📊 Module 3 — Analytics, Reporting & Transparency

### 3.1 Central Admin Dashboard & Operational Monitoring

Administrators access a unified dashboard for real-time operational oversight.

**Summary Metrics Displayed:**
- Total number of branches
- Total tokens generated today
- Active (currently waiting) tokens
- Average waiting time across branches
- Total services completed today

**Dashboard Features:**
- Filter metrics by a selected date and by a specific branch or across all branches.
- Highlights operational alerts, including branches in Maintenance status or branches approaching their daily capacity limit.

---

### 3.2 Report Generation & Export System

Administrators can generate, preview, and export structured service reports.

**Report Types:**
- Daily reports for a selected branch and date.
- Monthly reports for a selected branch and date range.

**Report Contents:**
- Total tokens issued, completed, and cancelled.
- Average waiting time.
- Branch-level totals and breakdowns.
- Service usage and performance statistics.
- Activity logs for audit purposes.

**Export Formats:**
- **CSV** — for data analysis and processing.
- **PDF** — for printing or official sharing.

**Additional Features:**
- Validates report parameters to prevent invalid or incomplete exports.
- Logs each report generation event, recording who generated it, when, the report type, and the filters applied.
- Supports filtering, quick preview, and organized storage of generated reports for future access.

---

### 3.3 Load Comparison & Branch Optimization View

The system helps citizens and administrators identify the least crowded branch for a given service.

**Features:**
- Compares two or more branches based on current service demand and queue length.
- Recommends the least crowded branch to optimize user distribution.
- Aims to reduce average waiting times by distributing load more evenly across branches.

---

### 3.4 Historical Queue Analytics

Provides administrators with data-driven insights to support planning and performance optimization.

**Analytics Provided:**
- Daily and weekly queue trend analysis.
- Identification of peak hours per branch and per service.
- Service demand analysis across different time periods.

**Presentation:**
- Insights are presented through visual charts for quick interpretation and decision-making.

---

### 3.5 Advanced Search & Filtering

Users can search and filter available services and slots with precision.

**Filter Options:**
- Search by branch name or location.
- Filter by service type.
- Filter by date and time range.
- Filter by current queue length.

**Purpose:**
- Allows users to quickly identify available slots and make informed decisions about which branch and time to visit.

---

### 3.6 Citizen Activity History

Each citizen has access to a structured personal history of their interactions with the system.

**History Includes:**
- Past slot bookings and their statuses.
- Token history (generated, completed, cancelled).
- Record of completed services.

**Purpose:**
- Enables citizens to track previous interactions, review their service usage patterns, and maintain transparency in their service engagements.

---

### 3.7 Queue Status Transparency Panel (Public Dashboard)

A publicly accessible panel that allows anyone to monitor queue status without logging in.

**Information Displayed:**
- Currently active (serving) token number.
- Total queue length per service point.
- Estimated waiting time per service point.

**System Properties:**
- No login required — accessible to any visitor.
- Continuously updated to reflect real-time queue progress.
- Accessible and responsive across all device types (mobile, tablet, desktop).
- Designed to help citizens plan their visit efficiently and avoid unnecessary waiting.

