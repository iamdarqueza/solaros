'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dispatchService, DispatchStatistics, CreateDispatchData } from '@/services/dispatchService';
import { supabase } from '@/lib/supabase';
import ActiveDispatchesTable from '@/components/dispatch/ActiveDispatchesTable';
import CompleteDispatchesTable from '@/components/dispatch/CompleteDispatchesTable';
import AddDispatchModal from '@/components/dispatch/AddDispatchModal';
import SuccessModal from '@/components/ui/SuccessModal';
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

type TimePeriod = 'today' | 'last7days' | 'last30days' | 'custom';
type DispatchType = 'active' | 'complete';

export default function DispatchPage() {
  const { organization } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [dispatchType, setDispatchType] = useState<DispatchType>('active');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statistics, setStatistics] = useState<DispatchStatistics>({
    total_dispatches: 0,
    scheduled_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    delayed_count: 0,
    cancelled_count: 0,
    urgent_count: 0,
    high_count: 0,
    normal_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    dispatchId: string;
    trackingId: string;
    title: string;
    plateNumber: string;
    scheduledTime: string;
    priority: string;
    routeType: string;
  } | null>(null);

  const getCurrentPeriodLabel = () => {
    if (selectedPeriod === 'custom') {
      if (customStartDate && customEndDate) {
        return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
      }
      return 'Custom range';
    }
    const periodOptions = [
      { value: 'today', label: 'Today' },
      { value: 'last7days', label: 'Last 7 days' },
      { value: 'last30days', label: 'Last 30 days' },
      { value: 'custom', label: 'Custom range' },
    ];
    return periodOptions.find(option => option.value === selectedPeriod)?.label || 'Today';
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    
    // Reset custom dates when switching away from custom
    if (period !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const loadStatistics = React.useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (selectedPeriod) {
        case 'today':
          startDate = today.toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'last7days':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'last30days':
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate).toISOString();
            endDate = new Date(customEndDate + 'T23:59:59').toISOString();
          }
          break;
      }
      
      const stats = await dispatchService.getDispatchStatistics(organization.id, startDate, endDate);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    if (organization?.id) {
      loadStatistics();
    }
  }, [organization?.id, loadStatistics]);

  const handleCreateDispatch = async (formData: CreateDispatchData) => {
    if (!organization?.id) return;
    
    setIsSubmitting(true);
    try {
      const newDispatch = await dispatchService.createDispatch(organization.id, formData);
      console.log('Dispatch created successfully:', newDispatch);
      
      // Get vehicle details for success modal
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('plate_number')
        .eq('id', formData.vehicle_id)
        .single();
      
      // Refresh statistics
      await loadStatistics();
      
      // Show success message
      setSuccessData({
        dispatchId: newDispatch.id,
        trackingId: newDispatch.tracking_id,
        title: formData.title,
        plateNumber: vehicleData?.plate_number || 'Unknown',
        scheduledTime: `${new Date(formData.planned_start_time).toLocaleString()} - ${new Date(formData.planned_end_time).toLocaleString()}`,
        priority: formData.priority,
        routeType: formData.route_type
      });
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error creating dispatch:', error);
      alert(`Error creating dispatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshData = () => {
    loadStatistics();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <PageBreadCrumb pageTitle="Dispatch Management" />
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Dispatch
        </button>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        {/* Dispatches - Main Content */}
        <div className="col-span-12 lg:col-span-9">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {dispatchType === 'active' ? 'Active Dispatches' : 'Complete Dispatches'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {dispatchType === 'active' 
                    ? 'Ongoing and scheduled dispatch assignments' 
                    : 'Completed and cancelled dispatch assignments'
                  }
                </p>
              </div>
              
              {/* Dispatch Type Selector */}
              <div className="relative">
                <select
                  value={dispatchType}
                  onChange={(e) => setDispatchType(e.target.value as DispatchType)}
                  className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                >
                  <option value="active">Active Dispatches</option>
                  <option value="complete">Complete Dispatches</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {dispatchType === 'active' ? (
              <ActiveDispatchesTable onRefresh={refreshData} />
            ) : (
              <CompleteDispatchesTable onRefresh={refreshData} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-4 md:space-y-6 2xl:space-y-7.5">
          {/* Summary with Time Period Selector */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Summary
              </h3>
              
              {/* Time Period Selector */}
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}
                  className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                >
                  <option value="today">Today</option>
                  <option value="last7days">Last 7 days</option>
                  <option value="last30days">Last 30 days</option>
                  <option value="custom">Custom range</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getCurrentPeriodLabel()}
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Dispatches</span>
                <span className="font-semibold text-gray-900 dark:text-white">{statistics.total_dispatches}</span>
              </div>

              {/* In Progress */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{statistics.in_progress_count}</span>
              </div>

              {/* Completed */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{statistics.completed_count}</span>
              </div>

              {/* Scheduled */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">{statistics.scheduled_count}</span>
              </div>

              {/* Delayed */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delayed</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">{statistics.delayed_count}</span>
              </div>

              {/* Cancelled */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{statistics.cancelled_count}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Dispatch</span>
              </button>
              
              <button 
                onClick={() => setDispatchType(dispatchType === 'active' ? 'complete' : 'active')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  View {dispatchType === 'active' ? 'Complete' : 'Active'} Dispatches
                </span>
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fleet Map</span>
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* Add Dispatch Modal */}
      <AddDispatchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateDispatch}
        isLoading={isSubmitting}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Dispatch Created Successfully!"
        message="Your dispatch has been created and the vehicle status has been updated to 'Active'."
        details={successData ? {
          dispatchId: successData.dispatchId,
          trackingId: successData.trackingId,
          title: successData.title,
          plateNumber: successData.plateNumber,
          scheduledTime: successData.scheduledTime,
          priority: successData.priority,
          routeType: successData.routeType
        } : undefined}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </>
  );
} 