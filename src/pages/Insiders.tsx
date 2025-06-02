import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, UserRound, Mail, Phone, Building2, MoreVertical, X, AlertCircle, Check, FileText, Wand2, ChevronDown, PenLine, CheckCircle, Trash2, Upload, Calendar } from 'lucide-react';
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
  company_name: string | null;
  job_title: string | null;
  type: string;
  last_contacted: string | null;
  created_at: string;
  tags: string[];
  soundings?: {
    id: string;
    subject: string;
    project_name: string;
    status: 'Live' | 'Cleansed';
  }[];
}

interface MarketSounding {
  id: string;
  subject: string;
  description: string | null;
  project_name: string;
  status: 'Live' | 'Cleansed';
  created_at: string;
  cleansed_at: string | null;
  expected_cleanse_date?: string;
  type: string;
  insider_count?: number;
}

const soundingTypes = [
  'Financial Results',
  'Acquisitions and Disposals',
  'Dividend Announcements',
  'Corporate Governance Changes',
  'Share Issuance and Buybacks',
  'Regulatory Compliance',
  'Inside Information',
  'Strategic Updates',
  'Risk Factors',
  'Sustainability and Corporate Social Responsibility'
] as const;

type SoundingType = typeof soundingTypes[number];

const Insiders: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [marketSoundings, setMarketSoundings] = useState<MarketSounding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSoundingModal, setShowSoundingModal] = useState(false);
  const [showCleanseConfirm, setShowCleanseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedSounding, setSelectedSounding] = useState<string | null>(null);
  const [isCleansing, setIsCleansing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContact, setEditedContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    type: 'Investor' as const
  });
  const [newSounding, setNewSounding] = useState({
    subject: '',
    description: '',
    project_name: '',
    expected_cleanse_date: '',
    type: 'Inside Information' as SoundingType,
    files: [] as File[]
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        console.warn('No company found for user');
        setIsLoading(false);
        return;
      }

      // Load contacts with their associated soundings
      const { data: contactsData, error: contactsError } = await supabase
        .from('crm_customers')
        .select(`
          *,
          soundings:insider_soundings(
            sounding:market_soundings(
              id,
              subject,
              project_name,
              status
            )
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending