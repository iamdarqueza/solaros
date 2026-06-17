'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dispatchService, DispatchAssignmentWithDetails } from '@/services/dispatchService';
import { useAuth } from '@/context/AuthContext';
import { formatDuration } from '@/utils/timeUtils';

// Debug: Expose dispatch service to browser console for testing
if (typeof window !== 'undefined') {
  (window as any).debugDispatchService = dispatchService;
}

interface ActiveDispatchesTableProps {
  onRefresh?: () => void;
}

export default function ActiveDispatchesTable({ onRefresh }: ActiveDispatchesTableProps) {
  const { organization } = useAuth();
  const [dispatches, setDispatches] = useState<DispatchAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLTableDataCellElement>(null);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000); // Auto dismiss after 5 seconds
  };

  // Load active dispatches
  const loadActiveDispatches = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      const activeDispatchesData = await dispatchService.getActiveDispatches(organization.id);
      setDispatches(activeDispatchesData);
    } catch (error) {
      console.error('Error loading active dispatches:', error);
      showNotification('error', 'Failed to load active dispatches');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  // Load active dispatches
  useEffect(() => {
    loadActiveDispatches();
  }, [loadActiveDispatches]);

  // Set up refresh interval to check for delays every minute
  useEffect(() => {
    const interval = setInterval(() => {
      loadActiveDispatches();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [loadActiveDispatches]);

  const toggleExpandedRow = (dispatchId: string) => {
    setExpandedRow(expandedRow === dispatchId ? null : dispatchId);
  };

  const toggleDropdown = (dispatchId: string) => {
    setOpenDropdown(openDropdown === dispatchId ? null : dispatchId);
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const formatDateOnly = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string, delayMinutes?: number) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'scheduled':
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400`}>
            Scheduled
          </span>
        );
      case 'in progress':
      case 'in_progress':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}>
            In Progress
          </span>
        );
      case 'delayed':
        return (
          <div className="flex items-center gap-2">
            <span className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`}>
              Delayed
            </span>
            {delayMinutes && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                 +{formatDuration(delayMinutes)}
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (priority) {
      case 'urgent':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`}>
            🔥 Urgent
          </span>
        );
      case 'high':
        return (
          <span className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`}>
            ⚡ High
          </span>
        );
      case 'normal':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>
            Normal
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>
            {priority}
          </span>
        );
    }
  };

  const handleStartDispatch = async (dispatchId: string, dispatchTitle: string) => {
    try {
      setActionLoading(dispatchId);
      
      // Find the dispatch to log its current status
      const dispatch = dispatches.find(d => d.id === dispatchId);
      console.log(`Attempting to start dispatch ${dispatchId} with status: ${dispatch?.status}`);
      console.log('Full dispatch object:', dispatch);
      
      // Test basic dispatch update first
      console.log('Testing basic dispatch update...');
      const testResult = await dispatchService.testDispatchUpdate(dispatchId);
      console.log('Test result:', testResult);
      
      if (testResult.error) {
        console.error('Basic update test failed:', testResult.error);
        showNotification('error', `Database access error: ${testResult.error.message || 'Unknown error'}`);
        return;
      }
      
      console.log('Basic update test passed, proceeding with startDispatch...');
      await dispatchService.startDispatch(dispatchId);
      await loadActiveDispatches();
      setOpenDropdown(null);
      showNotification('success', `Dispatch "${dispatchTitle}" has been started successfully!`);
      onRefresh?.(); // Refresh parent component
    } catch (error) {
      console.error('Error starting dispatch:', error);
      console.error('Error details:', {
        dispatchId,
        dispatchTitle,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      showNotification('error', `Failed to start dispatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteDispatch = async (dispatchId: string, dispatchTitle: string) => {
    try {
      setActionLoading(dispatchId);
      await dispatchService.completeDispatch(dispatchId);
      await loadActiveDispatches();
      setOpenDropdown(null);
      showNotification('success', `Dispatch "${dispatchTitle}" has been completed successfully!`);
      onRefresh?.(); // Refresh parent component
    } catch (error) {
      console.error('Error completing dispatch:', error);
      showNotification('error', `Failed to complete dispatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelDispatch = async (dispatchId: string, dispatchTitle: string) => {
    if (confirm(`Are you sure you want to cancel the dispatch "${dispatchTitle}"?`)) {
      try {
        setActionLoading(dispatchId);
        await dispatchService.cancelDispatch(dispatchId);
        await loadActiveDispatches();
        setOpenDropdown(null);
        showNotification('success', `Dispatch "${dispatchTitle}" has been cancelled successfully!`);
        onRefresh?.(); // Refresh parent component
      } catch (error) {
        console.error('Error cancelling dispatch:', error);
        showNotification('error', `Failed to cancel dispatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading active dispatches...</p>
      </div>
    );
  }

  if (dispatches.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-12 h-12 text-gray-400 mb-4 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No active dispatches
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          All dispatches have been completed or there are no active assignments.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden min-h-[50vh] max-h-[calc(100vh-200px)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 w-8"></th>
                <th scope="col" className="px-6 py-3">Tracking ID</th>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3">Route Type</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Priority</th>
                <th scope="col" className="px-6 py-3">Vehicle</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map((dispatch) => (
                <React.Fragment key={dispatch.id}>
                  {/* Main Row */}
                  <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    {/* Expand Button */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleExpandedRow(dispatch.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedRow === dispatch.id ? 'rotate-90' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>

                    {/* Tracking ID */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                        #{dispatch.tracking_id}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {dispatch.title}
                    </td>

                    {/* Route Type */}
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 capitalize">
                      {dispatch.route_type}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(dispatch.status, dispatch.delay_minutes)}
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      {getPriorityBadge(dispatch.priority)}
                    </td>

                    {/* Vehicle */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {dispatch.vehicle_plate || dispatch.vehicle_name || 'Unknown Vehicle'}
                        </p>
                        {dispatch.driver_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Driver: {dispatch.driver_name}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 relative" ref={dropdownRef}>
                      <button
                        onClick={() => toggleDropdown(dispatch.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        disabled={actionLoading === dispatch.id}
                      >
                        {actionLoading === dispatch.id ? (
                          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        )}
                      </button>

                      {openDropdown === dispatch.id && actionLoading !== dispatch.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                          <div className="py-1">
                            {(dispatch.status === 'scheduled' || dispatch.status === 'delayed') && (
                              <button
                                onClick={() => handleStartDispatch(dispatch.id, dispatch.title)}
                                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6L9 9l11 11-11-11z" />
                                </svg>
                                Start Dispatch
                              </button>
                            )}
                            {(dispatch.status === 'in_progress' || dispatch.status === 'in progress') && (
                              <button
                                onClick={() => handleCompleteDispatch(dispatch.id, dispatch.title)}
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Mark as Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelDispatch(dispatch.id, dispatch.title)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel Dispatch
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedRow === dispatch.id && (
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <td colSpan={8} className="px-6 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Timing Information */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              📅 Timing Information
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Scheduled Departure</p>
                                <p className="text-gray-900 dark:text-white">{formatDateTime(dispatch.planned_start_time)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Estimated Arrival</p>
                                <p className="text-gray-900 dark:text-white">{formatDateTime(dispatch.planned_end_time)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Actual Departure</p>
                                <p className="text-gray-900 dark:text-white">{formatDateTime(dispatch.actual_start_time)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Actual Arrival</p>
                                <p className="text-gray-900 dark:text-white">{formatDateTime(dispatch.actual_end_time)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Route & Creation Information */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              🗺️ Route & Details
                            </h4>
                            
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Origin</p>
                                <p className="text-gray-900 dark:text-white">{dispatch.route_origin || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Destination</p>
                                <p className="text-gray-900 dark:text-white">{dispatch.route_destination || 'Not specified'}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400 font-medium">Distance</p>
                                  <p className="text-gray-900 dark:text-white">
                                    {dispatch.route_distance ? `${dispatch.route_distance.toFixed(2)} miles` : 'Not calculated'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400 font-medium">Created</p>
                                  <p className="text-gray-900 dark:text-white">{formatDateOnly(dispatch.created_at)}</p>
                                </div>
                              </div>
                              {dispatch.instructions && (
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400 font-medium">Instructions</p>
                                  <p className="text-gray-900 dark:text-white">{dispatch.instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
} 