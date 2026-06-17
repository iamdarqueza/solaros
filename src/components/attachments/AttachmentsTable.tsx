"use client";
import React, { useState, useEffect, useRef } from "react";
import { attachmentsService, AttachmentWithDetails, CreateAttachmentData } from '@/services/attachmentsService';
import { vehiclesService } from '@/services/vehiclesService';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/modal';
import AddAttachmentModal from './AddAttachmentModal';
import EditAttachmentModal from './EditAttachmentModal';
import AttachmentQRCodeModal from './AttachmentQRCodeModal';
import AttachDetachVehicleModal from './AttachDetachVehicleModal';
import ViewDocumentsModal from '../documents/ViewDocumentsModal';

interface Attachment {
    id: string;
    name: string;
    type: string;
    make: string;
    model: string;
    serial_number: string;
    assigned_vehicle_name?: string;
    status: string;
    created_at: string;
}

const getStatusColor = (status: Attachment["status"]) => {
    switch (status) {
        case "Available":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "In Use":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "Under Maintenance":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        case "Lost":
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
};

export default function AttachmentsTable() {
    const { organization } = useAuth();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [filteredAttachments, setFilteredAttachments] = useState<Attachment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAttachment, setEditingAttachment] = useState<AttachmentWithDetails | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vehicles, setVehicles] = useState<Array<{ id: string; plate_number: string }>>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string>('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedAttachmentForQR, setSelectedAttachmentForQR] = useState<{ serialNumber: string; name: string; type: string } | null>(null);
    const [showDocumentsModal, setShowDocumentsModal] = useState(false);
    const [selectedAttachmentForDocs, setSelectedAttachmentForDocs] = useState<{ id: string; name: string; model?: string } | null>(null);
    const [showAttachDetachModal, setShowAttachDetachModal] = useState(false);
    const [attachDetachMode, setAttachDetachMode] = useState<'attach' | 'detach'>('attach');
    const [selectedAttachmentForVehicle, setSelectedAttachmentForVehicle] = useState<{ id: string; name: string; currentVehicle?: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Status mapping for display
    const statusMap: Record<string, string> = {
        available: 'Available',
        in_use: 'In Use',
        under_maintenance: 'Under Maintenance',
        lost: 'Lost',
        offline: 'Offline'
    };

    // Transform AttachmentWithDetails to Attachment interface for UI compatibility
    const transformAttachmentData = (attachment: AttachmentWithDetails): Attachment => {
        // Map database status to UI status
        const status = statusMap[attachment.status];

        return {
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            make: attachment.make,
            model: attachment.model,
            serial_number: attachment.serial_number,
            status: status,
            assigned_vehicle_name: attachment.assigned_vehicle_name || '-',
            created_at: attachment.updated_at ? new Date(attachment.updated_at).toLocaleString() : 'Never',
        };
    };

    // Load attachments from Supabase
    useEffect(() => {
        const loadAttachments = async () => {
            if (!organization?.id) return;

            try {
                setLoading(true);
                const attachmentsData = await attachmentsService.getAttachments(organization.id);
                const transformedAttachments = attachmentsData.map(transformAttachmentData);
                setAttachments(transformedAttachments);
                setFilteredAttachments(transformedAttachments);
            } catch (error) {
                console.error('Error loading attachments:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAttachments();
    }, [organization?.id]);

    // Load vehicles for dropdown
    useEffect(() => {
        const loadVehicles = async () => {
            if (!organization?.id) return;

            try {
                const vehiclesData = await vehiclesService.getVehicles(organization.id);
                setVehicles(vehiclesData.map(v => ({ id: v.id, plate_number: v.plate_number })));
            } catch (error) {
                console.error('Error loading vehicles:', error);
            }
        };

        loadVehicles();
    }, [organization?.id]);

    // Set up real-time subscription
    useEffect(() => {
        if (!organization?.id) return;

        const subscription = attachmentsService.subscribeToAttachmentUpdates(
            organization.id,
            (updatedAttachments: AttachmentWithDetails[]) => {
                const transformedAttachments = updatedAttachments.map(transformAttachmentData);
                setAttachments(transformedAttachments);
                setFilteredAttachments(transformedAttachments);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [organization?.id]);

    // Filter attachments based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredAttachments(attachments);
        } else {
            const filtered = attachments.filter(attachment =>
                attachment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                attachment.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredAttachments(filtered);
        }
    }, [attachments, searchTerm]);

    const handleAddAttachment = () => {
        setShowAddModal(true);
    };

    const handleEditAttachment = async (attachmentId: string) => {
        try {
            setOpenDropdown(null);
            const attachmentData = await attachmentsService.getAttachment(attachmentId);
            if (attachmentData) {
                setEditingAttachment(attachmentData);
                setShowEditModal(true);
            }
        } catch (error) {
            console.error('Error fetching attachment for edit:', error);
            setNotification({ type: 'error', message: 'Failed to load equipment details. Please try again.' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleEditAttachmentSubmit = async (attachmentData: Partial<CreateAttachmentData>) => {
        if (!editingAttachment) return;

        try {
            setIsSubmitting(true);
            const updatedAttachment = await attachmentsService.updateAttachment(editingAttachment.id, attachmentData);
            const transformedAttachment = transformAttachmentData(updatedAttachment);

            // Update the attachment in the list
            setAttachments(prev => prev.map(attachment =>
                attachment.id === editingAttachment.id ? transformedAttachment : attachment
            ));

            setEditingAttachment(null);
            setShowEditModal(false);
            setNotification({ type: 'success', message: 'Equipment updated successfully!' });

            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error updating attachment:', error);
            setNotification({ type: 'error', message: 'Failed to update equipment. Please try again.' });
            setTimeout(() => setNotification(null), 3000);
            throw error; // Re-throw to show error in modal
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddAttachmentSubmit = async (attachmentData: CreateAttachmentData) => {
        if (!organization?.id) return;

        try {
            setIsSubmitting(true);
            const newAttachment = await attachmentsService.createAttachment(organization.id, attachmentData);
            const transformedAttachment = transformAttachmentData(newAttachment);
            setAttachments(prev => [transformedAttachment, ...prev]);
            setNotification({ type: 'success', message: 'Equipment added successfully!' });

            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error creating attachment:', error);
            setNotification({ type: 'error', message: 'Failed to add equipment. Please try again.' });
            setTimeout(() => setNotification(null), 3000);
            throw error; // Re-throw to show error in modal
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        setAttachmentToDelete(attachmentId);
        setShowDeleteConfirm(true);
        setOpenDropdown(null);
        setDeleteError('');
    };

    const confirmDeleteAttachment = async () => {
        if (!attachmentToDelete) return;

        try {
            setIsSubmitting(true);
            await attachmentsService.deleteAttachment(attachmentToDelete);
            setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentToDelete));
            setShowDeleteConfirm(false);
            setAttachmentToDelete(null);
            setDeleteError('');
            setNotification({ type: 'success', message: 'Equipment deleted successfully!' });

            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error removing attachment:', error);
            setDeleteError('Failed to delete equipment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelDeleteAttachment = () => {
        setShowDeleteConfirm(false);
        setAttachmentToDelete(null);
        setDeleteError('');
    };

    const handleShowQRCode = (attachment: Attachment) => {
        setSelectedAttachmentForQR({
            serialNumber: attachment.serial_number,
            name: attachment.name,
            type: attachment.type
        });
        setShowQRModal(true);
        setOpenDropdown(null);
    };

    const handleShowDocuments = (attachment: Attachment) => {
        setSelectedAttachmentForDocs({
            id: attachment.id,
            name: attachment.name,
            model: attachment.model
        });
        setShowDocumentsModal(true);
        setOpenDropdown(null);
    };

    const handleAttachToVehicle = (attachment: Attachment) => {
        setSelectedAttachmentForVehicle({
            id: attachment.id,
            name: attachment.name
        });
        setAttachDetachMode('attach');
        setShowAttachDetachModal(true);
        setOpenDropdown(null);
    };

    const handleDetachFromVehicle = (attachment: Attachment) => {
        setSelectedAttachmentForVehicle({
            id: attachment.id,
            name: attachment.name,
            currentVehicle: attachment.assigned_vehicle_name
        });
        setAttachDetachMode('detach');
        setShowAttachDetachModal(true);
        setOpenDropdown(null);
    };

    const handleAttachDetachSubmit = async (vehicleId: string | null) => {
        if (!selectedAttachmentForVehicle) return;

        try {
            setIsSubmitting(true);
            let updatedAttachment;
            
            if (attachDetachMode === 'attach' && vehicleId) {
                updatedAttachment = await attachmentsService.attachToVehicle(selectedAttachmentForVehicle.id, vehicleId);
                setNotification({ type: 'success', message: 'Equipment attached to vehicle successfully!' });
            } else if (attachDetachMode === 'detach') {
                updatedAttachment = await attachmentsService.detachFromVehicle(selectedAttachmentForVehicle.id);
                setNotification({ type: 'success', message: 'Equipment detached from vehicle successfully!' });
            }

            if (updatedAttachment) {
                const transformedAttachment = transformAttachmentData(updatedAttachment);
                setAttachments(prev => prev.map(attachment =>
                    attachment.id === selectedAttachmentForVehicle.id ? transformedAttachment : attachment
                ));
            }

            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error(`Error ${attachDetachMode}ing equipment:`, error);
            setNotification({ 
                type: 'error', 
                message: `Failed to ${attachDetachMode} equipment. Please try again.` 
            });
            setTimeout(() => setNotification(null), 3000);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleDropdown = (attachmentId: string) => {
        setOpenDropdown(openDropdown === attachmentId ? null : attachmentId);
    };

    const toggleExpandedRow = (attachmentId: string) => {
        setExpandedRow(expandedRow === attachmentId ? null : attachmentId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-dark lg:p-6">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${notification.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {notification.type === 'success' ? (
                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{notification.message}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setNotification(null)}
                                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${notification.type === 'success'
                                        ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                                        : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                                    }`}
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Attachments & Equipment
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your fleet attachments and equipment
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                                className="h-4 w-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or serial number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 w-72 pl-10 pr-4 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <svg
                                    className="h-4 w-4 text-gray-400 hover:text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Add Attachment Button */}
                    <button
                        onClick={handleAddAttachment}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Add Equipment
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="overflow-x-auto min-h-[50vh] max-h-[calc(100vh-200px)]">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-white dark:bg-gray-dark z-10">
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Equipment
                                </th>
                                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Type
                                </th>
                                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Status
                                </th>
                                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Assigned Vehicle
                                </th>
                                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Last Update
                                </th>
                                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {filteredAttachments.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <svg
                                                className="w-12 h-12 text-gray-400 mb-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                                />
                                            </svg>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                {searchTerm ? 'No equipment found' : 'No equipment yet'}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                                {searchTerm
                                                    ? `No equipment matches "${searchTerm}". Try a different search term.`
                                                    : 'Get started by adding your first piece of equipment.'
                                                }
                                            </p>
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAttachments.map((attachment) => (
                                    <React.Fragment key={attachment.id}>
                                        <tr
                                            className="group hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                                            onClick={() => toggleExpandedRow(attachment.id)}
                                        >
                                            <td className="py-4 text-sm text-gray-800 dark:text-white/90">
                                                <div className="flex items-center gap-2">
                                                    <svg
                                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedRow === attachment.id ? 'rotate-90' : ''
                                                            }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                    <div>
                                                        <div className="font-medium">{attachment.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            S/N: {attachment.serial_number}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {attachment.type}
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(attachment.status)}`}>
                                                    {attachment.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {attachment.assigned_vehicle_name}
                                            </td>
                                            <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {attachment.created_at}
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="relative" ref={openDropdown === attachment.id ? dropdownRef : null}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleDropdown(attachment.id);
                                                        }}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                        </svg>
                                                    </button>

                                                    {openDropdown === attachment.id && (
                                                        <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                                                            <button
                                                                onClick={() => handleShowQRCode(attachment)}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                                            >
                                                                <svg
                                                                    className="mr-3 h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M3 3h6v6H3V3zM15 3h6v6h-6V3zM3 15h6v6H3v-6zM18 21l-3-3v2H9v2h6v2z"
                                                                    />
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M5 5h2v2H5V5zM17 5h2v2h-2V5zM5 17h2v2H5v-2z"
                                                                    />
                                                                </svg>
                                                                Show QR Code
                                                            </button>
                                                            <button
                                                                onClick={() => handleShowDocuments(attachment)}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                            >
                                                                <svg
                                                                    className="mr-3 h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                Documents
                                                            </button>
                                                            
                                                            {/* Attach/Detach Vehicle Buttons */}
                                                            {attachment.status === 'Available' && (
                                                                <button
                                                                    onClick={() => handleAttachToVehicle(attachment)}
                                                                    className="flex w-full items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                                >
                                                                    <svg
                                                                        className="mr-3 h-4 w-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M12 4v16m8-8H4"
                                                                        />
                                                                    </svg>
                                                                    Attach to Vehicle
                                                                </button>
                                                            )}
                                                            
                                                            {attachment.status === 'In Use' && (
                                                                <button
                                                                    onClick={() => handleDetachFromVehicle(attachment)}
                                                                    className="flex w-full items-center px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                                                >
                                                                    <svg
                                                                        className="mr-3 h-4 w-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M20 12H4"
                                                                        />
                                                                    </svg>
                                                                    Detach from Vehicle
                                                                </button>
                                                            )}
                                                            
                                                            <button
                                                                onClick={() => handleEditAttachment(attachment.id)}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                                            >
                                                                <svg
                                                                    className="mr-3 h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                                Edit Equipment
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveAttachment(attachment.id)}
                                                                className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                            >
                                                                <svg
                                                                    className="mr-3 h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                                Remove Equipment
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {expandedRow === attachment.id && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-6 bg-gray-50 dark:bg-white/5">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Equipment Details */}
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                                                Equipment Details
                                                            </h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-500 dark:text-gray-400">Make:</span>
                                                                    <span className="text-gray-900 dark:text-white">{attachment.make}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-500 dark:text-gray-400">Model:</span>
                                                                    <span className="text-gray-900 dark:text-white">{attachment.model}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Additional Info */}
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                                                Additional Information
                                                            </h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="text-gray-500 dark:text-gray-400">
                                                                    Last updated: {attachment.created_at}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Attachment Modal */}
            {showAddModal && (
                <AddAttachmentModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddAttachmentSubmit}
                    vehicles={vehicles}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Edit Attachment Modal */}
            {showEditModal && editingAttachment && (
                <EditAttachmentModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingAttachment(null);
                    }}
                    onSubmit={handleEditAttachmentSubmit}
                    attachment={editingAttachment}
                    vehicles={vehicles}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal isOpen={showDeleteConfirm} onClose={cancelDeleteAttachment} maxWidth="w-96">
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-6 w-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Delete Equipment
                                </h3>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete{' '}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {attachmentToDelete && attachments.find(a => a.id === attachmentToDelete)?.name}
                                </span>
                                ? This action cannot be undone.
                            </p>
                        </div>

                        {deleteError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{deleteError}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={cancelDeleteAttachment}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteAttachment}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Equipment'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedAttachmentForQR && (
                <AttachmentQRCodeModal
                    isOpen={showQRModal}
                    onClose={() => {
                        setShowQRModal(false);
                        setSelectedAttachmentForQR(null);
                    }}
                    serialNumber={selectedAttachmentForQR.serialNumber}
                    equipmentName={selectedAttachmentForQR.name}
                    equipmentType={selectedAttachmentForQR.type}
                />
            )}

            {/* Documents Modal */}
            {selectedAttachmentForDocs && (
                <ViewDocumentsModal
                    isOpen={showDocumentsModal}
                    onClose={() => {
                        setShowDocumentsModal(false);
                        setSelectedAttachmentForDocs(null);
                    }}
                    type="attachment"
                    itemId={selectedAttachmentForDocs.id}
                    itemName={selectedAttachmentForDocs.name}
                    itemModel={selectedAttachmentForDocs.model}
                />
            )}

            {/* Attach/Detach Vehicle Modal */}
            {showAttachDetachModal && selectedAttachmentForVehicle && (
                <AttachDetachVehicleModal
                    isOpen={showAttachDetachModal}
                    onClose={() => {
                        setShowAttachDetachModal(false);
                        setSelectedAttachmentForVehicle(null);
                    }}
                    onConfirm={handleAttachDetachSubmit}
                    vehicles={vehicles}
                    mode={attachDetachMode}
                    equipmentName={selectedAttachmentForVehicle.name}
                    currentVehicle={selectedAttachmentForVehicle.currentVehicle}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
} 