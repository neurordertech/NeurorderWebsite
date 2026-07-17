# NOUS-DB-002
# Neurorder Discovery Payment Architecture

**Document Code:** NOUS-DB-002  
**Project:** Nous Platform  
**Organisation:** NEURORDER (Pty) Ltd.  
**Status:** Draft  
**Version:** 1.0

---

## Purpose

This document defines the payment architecture for Neurorder Discovery.

Neurorder Discovery will provide a secure interface through which users can view membership options, understand pricing, begin a payment, receive confirmation and access the appropriate Nous services.

---

## Core Payment Flow

```text
User
  ↓
Neurorder Discovery Interface
  ↓
Secure Checkout Request
  ↓
Supabase Edge Function
  ↓
Yoco Checkout
  ↓
Yoco Payment Processing
  ↓
Secure Webhook
  ↓
Supabase Database
  ↓
Membership Activation
  ↓
User Confirmation
