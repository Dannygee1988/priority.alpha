import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, UserRound, Mail, Phone, Building2, MoreVertical, X, AlertCircle, Check, FileText, Wand2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string |