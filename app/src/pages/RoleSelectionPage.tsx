import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectRole } from '@/services/auth';
import { RoleCard } from "../components/cards/RoleSelectionCard";

interface RoleSelectionPageProps {}

export const RoleSettingsPage: React.FC<RoleSelectionPageProps> = () => {
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string>('');
   const navigate = useNavigate();

   const handleRoleSelection = async (role: 'athlete' | 'coach') => {
      setLoading(true);
      setError('');

      try {
         const response = await selectRole(role);
         // Store updated user data
         localStorage.setItem('user', JSON.stringify(response.user));

         // Navigate to main app
         navigate('/dashboard'); // or '/home'
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Failed to set role');
      } finally {
         setLoading(false);
      }
   };

   return (

   )
}
