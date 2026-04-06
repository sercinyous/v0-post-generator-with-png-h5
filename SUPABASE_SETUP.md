# Supabase Setup Guide

## 1. Database Schema Setup

**Adım 1:** Supabase Dashboard'a gidin (SQL Editor)

**Adım 2:** Aşağıdaki SQL'i çalıştırın:

```sql
-- Kopyala ve Supabase SQL Editor'da çalıştır
-- scripts/001_create_tables.sql dosyasının içeriğini yapıştır
```

[scripts/001_create_tables.sql dosyasındaki tüm SQL'i dashboard SQL Editor'da çalıştırın]

## 2. Default Templates Seed

**Adım 3:** Aşağıdaki SQL'i çalıştırın:

[scripts/002_seed_default_templates.sql dosyasındaki tüm SQL'i dashboard SQL Editor'da çalıştırın]

## 3. Environment Variables

Supabase project settings'den:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Bu değerleri .env.local'e ekleyin.

## 4. Test

Uygulama başlat, `/auth/sign-up` giderek kullanıcı oluştur. Sonra protected page'e erişebilmen lazım.
