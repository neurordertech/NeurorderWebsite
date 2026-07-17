# NOUS-DB-004
# Row Level Security Standard

**Document Code:** NOUS-DB-004  
**Project:** Nous Platform  
**Organisation:** NEURORDER (Pty) Ltd.  
**Status:** Draft  
**Version:** 1.0

---

# Purpose

This document defines the Row Level Security standard for the Nous Platform database.

Row Level Security ensures that users can only access database records they are authorised to view or change.

The database must enforce access rules directly, even when a user attempts to bypass the website or modify frontend JavaScript.

---

# Core Principle

```text
Authentication confirms who the user is.

Row Level Security confirms which records the user may access.
