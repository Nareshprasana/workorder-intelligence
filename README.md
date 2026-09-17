# AI-Powered Resident Complaint & Work Order Automation

An AI-assisted facility operations prototype that converts resident maintenance complaints into structured work requests and routes them to appropriate maintenance workers.

The project demonstrates a simple principle:

> Use AI where natural-language understanding is valuable, and use deterministic application logic where predictable operational behavior is required.

---

## The Problem

Residential facility teams receive maintenance complaints in unstructured natural language.

For example:

> "There is water leaking in my apartment and the floor is getting wet."

Traditionally, someone has to interpret the complaint, identify the maintenance category, determine its urgency, create a work request, find an appropriate worker, and communicate the job.

This prototype automates that workflow.

---

## Solution

The application provides an end-to-end workflow:

```text
Resident
   │
   ▼
Submit Complaint
   │
   ▼
Complaint stored in database
   │
   ▼
AI Analysis
   │
   ├── Category
   ├── Issue
   ├── Severity
   ├── Confidence
   └── Recommended Action
   │
   ▼
Work Request automatically created
   │
   ▼
Deterministic Worker Assignment
   │
   ▼
Worker Notification
   │
   ▼
Worker Accepts
   │
   ▼
Worker Completes Complaint