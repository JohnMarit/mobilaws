/**
 * Counsel Booking API Routes
 * Uber-like counsel booking system for South Sudan
 */

import { Router, Request, Response } from 'express';
import {
  createCounselRequest,
  getCounselRequest,
  getPendingCounselRequests,
  getUserCounselRequests,
  acceptCounselRequest,
  scheduleBooking,
  getQueuedAppointments,
  acceptQueuedAppointment,
  setCounselorOnlineStatus,
  getOnlineCounselors,
  getCounselor,
  completeCounselRequest,
  cancelCounselRequest,
  getAvailableCounselorsForState,
  getRequestsForCounselor,
  getCounselorStats,
  applyCounselor,
  getPendingCounselorApplications,
  getAllCounselors,
  approveCounselor,
  rejectCounselor,
  isApprovedCounselor,
  getCounselorApplicationStatus,
  SOUTH_SUDAN_STATES,
  LEGAL_CATEGORIES,
  type StateCode,
} from '../lib/counsel-storage';

const router = Router();

/**
 * Get South Sudan states and legal categories
 * GET /api/counsel/config
 */
router.get('/config', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    states: SOUTH_SUDAN_STATES,
    categories: LEGAL_CATEGORIES,
  });
});

/**
 * Get counselor statistics
 * GET /api/counsel/stats
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getCounselorStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * Create a new counsel request (broadcast to counselors)
 * POST /api/counsel/request
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { userId, userName, userEmail, userPhone, note, legalCategory, state } = req.body;

    if (!userId || !userName || !note || !legalCategory || !state) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, userName, note, legalCategory, state' 
      });
    }

    // Validate state
    const validState = SOUTH_SUDAN_STATES.find(s => s.code === state);
    if (!validState) {
      return res.status(400).json({ error: 'Invalid state code' });
    }

    const result = await createCounselRequest({
      userId,
      userName,
      userEmail: userEmail || '',
      userPhone: userPhone || '',
      note: note.trim(),
      legalCategory,
      state: state as StateCode,
    });

    if (!result.requestId) {
      return res.status(500).json({ error: 'Failed to create counsel request' });
    }

    res.json({
      success: true,
      requestId: result.requestId,
      broadcastCount: result.broadcastCount,
      hasAvailableCounselors: result.broadcastCount > 0,
      message: result.broadcastCount > 0
        ? `Request broadcast to ${result.broadcastCount} counselor(s) in ${validState.name}. Waiting for acceptance...`
        : `No counselors available in ${validState.name} right now. You can schedule an appointment.`,
    });
  } catch (error) {
    console.error('❌ Error creating counsel request:', error);
    res.status(500).json({ error: 'Failed to create counsel request' });
  }
});

/**
 * Schedule a booking for later (when no counselors available)
 * POST /api/counsel/schedule
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { 
      userId, userName, userEmail, userPhone, 
      note, legalCategory, state,
      preferredDate, preferredTime 
    } = req.body;

    if (!userId || !userName || !note || !legalCategory || !state || !preferredDate || !preferredTime) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    const requestId = await scheduleBooking(
      {
        userId,
        userName,
        userEmail: userEmail || '',
        userPhone: userPhone || '',
        note: note.trim(),
        legalCategory,
        state: state as StateCode,
      },
      preferredDate,
      preferredTime
    );

    if (!requestId) {
      return res.status(500).json({ error: 'Failed to schedule booking' });
    }

    res.json({
      success: true,
      requestId,
      message: `Booking scheduled for ${preferredDate} at ${preferredTime}. A counselor will accept your request.`,
    });
  } catch (error) {
    console.error('❌ Error scheduling booking:', error);
    res.status(500).json({ error: 'Failed to schedule booking' });
  }
});

/**
 * Get pending counsel requests (for counselors)
 * GET /api/counsel/requests/pending
 */
router.get('/requests/pending', async (req: Request, res: Response) => {
  try {
    const requests = await getPendingCounselRequests();
    res.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

/**
 * Get requests for a specific counselor
 * GET /api/counsel/requests/counselor/:counselorId
 */
router.get('/requests/counselor/:counselorId', async (req: Request, res: Response) => {
  try {
    const { counselorId } = req.params;
    const requests = await getRequestsForCounselor(counselorId);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Error fetching counselor requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * Get user's counsel requests
 * GET /api/counsel/requests/user/:userId
 */
router.get('/requests/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requests = await getUserCounselRequests(userId);
    res.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Error fetching user requests:', error);
    res.status(500).json({ error: 'Failed to fetch user requests' });
  }
});

/**
 * Get a specific counsel request
 * GET /api/counsel/request/:requestId
 */
router.get('/request/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = await getCounselRequest(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('❌ Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

/**
 * Accept a counsel request
 * POST /api/counsel/request/:requestId/accept
 */
router.post('/request/:requestId/accept', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { counselorId, counselorName, counselorPhone } = req.body;

    if (!counselorId || !counselorName) {
      return res.status(400).json({ error: 'Missing required fields: counselorId, counselorName' });
    }

    const success = await acceptCounselRequest(requestId, counselorId, counselorName, counselorPhone);

    if (!success) {
      return res.status(400).json({ 
        error: 'Failed to accept request. It may have already been accepted by another counselor.' 
      });
    }

    res.json({ success: true, message: 'Request accepted successfully' });
  } catch (error) {
    console.error('❌ Error accepting request:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

/**
 * Complete a counsel request
 * POST /api/counsel/request/:requestId/complete
 */
router.post('/request/:requestId/complete', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const success = await completeCounselRequest(requestId);

    if (!success) {
      return res.status(400).json({ error: 'Failed to complete request' });
    }

    res.json({ success: true, message: 'Request completed successfully' });
  } catch (error) {
    console.error('❌ Error completing request:', error);
    res.status(500).json({ error: 'Failed to complete request' });
  }
});

/**
 * Cancel a counsel request
 * POST /api/counsel/request/:requestId/cancel
 */
router.post('/request/:requestId/cancel', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const success = await cancelCounselRequest(requestId, reason);

    if (!success) {
      return res.status(400).json({ error: 'Failed to cancel request' });
    }

    res.json({ success: true, message: 'Request cancelled' });
  } catch (error) {
    console.error('❌ Error cancelling request:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

/**
 * Get queued appointments (for counselors)
 * GET /api/counsel/appointments/queued
 */
router.get('/appointments/queued', async (req: Request, res: Response) => {
  try {
    const { state } = req.query;
    const appointments = await getQueuedAppointments(state as StateCode | undefined);
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('❌ Error fetching queued appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * Accept a queued appointment
 * POST /api/counsel/appointment/:appointmentId/accept
 */
router.post('/appointment/:appointmentId/accept', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { counselorId, counselorName, counselorPhone } = req.body;

    if (!counselorId || !counselorName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await acceptQueuedAppointment(
      appointmentId, 
      counselorId, 
      counselorName,
      counselorPhone
    );

    if (!success) {
      return res.status(400).json({ error: 'Failed to accept appointment' });
    }

    res.json({ success: true, message: 'Appointment accepted' });
  } catch (error) {
    console.error('❌ Error accepting appointment:', error);
    res.status(500).json({ error: 'Failed to accept appointment' });
  }
});

/**
 * Apply to become a counselor
 * POST /api/counsel/counselor/apply
 */
router.post('/counselor/apply', async (req: Request, res: Response) => {
  try {
    const { userId, name, email, phone, nationalIdNumber, idDocumentUrl, state, servingStates, specializations } = req.body;

    console.log('📝 Counselor application received:', {
      userId: userId ? '✓' : '✗',
      name: name ? '✓' : '✗',
      email: email ? '✓' : '✗',
      phone: phone ? '✓' : '✗',
      nationalIdNumber: nationalIdNumber ? '✓' : '✗',
      state: state ? '✓' : '✗',
      body: req.body
    });

    if (!userId || !name || !email || !phone || !nationalIdNumber || !state) {
      const missing = [];
      if (!userId) missing.push('userId');
      if (!name) missing.push('name');
      if (!email) missing.push('email');
      if (!phone) missing.push('phone');
      if (!nationalIdNumber) missing.push('nationalIdNumber');
      if (!state) missing.push('state');
      
      console.error('❌ Missing fields:', missing);
      return res.status(400).json({ 
        error: `Missing required fields: ${missing.join(', ')}`,
        received: { userId: !!userId, name: !!name, email: !!email, phone: !!phone, nationalIdNumber: !!nationalIdNumber, state: !!state }
      });
    }

    const result = await applyCounselor({
      userId,
      name,
      email,
      phone,
      nationalIdNumber,
      idDocumentUrl: idDocumentUrl || '',
      state: state as StateCode,
      servingStates: servingStates || [state],
      specializations: specializations || [],
    });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ 
      success: true, 
      message: result.message 
    });
  } catch (error) {
    console.error('❌ Error submitting counselor application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

/**
 * Get counselor application status
 * GET /api/counsel/counselor/status/:userId
 */
router.get('/counselor/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const status = await getCounselorApplicationStatus(userId);

    if (!status) {
      return res.status(500).json({ error: 'Failed to check status' });
    }

    res.json({ success: true, ...status });
  } catch (error) {
    console.error('❌ Error checking counselor status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * Check if user is an approved counselor
 * GET /api/counsel/counselor/approved/:userId
 */
router.get('/counselor/approved/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const approved = await isApprovedCounselor(userId);

    res.json({ success: true, approved });
  } catch (error) {
    console.error('❌ Error checking counselor approval:', error);
    res.status(500).json({ error: 'Failed to check approval status' });
  }
});

// ========== ADMIN ENDPOINTS ==========

/**
 * Get pending counselor applications (admin only)
 * GET /api/counsel/admin/applications/pending
 */
router.get('/admin/applications/pending', async (_req: Request, res: Response) => {
  try {
    const applications = await getPendingCounselorApplications();
    res.json({ success: true, applications });
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * Get all counselors (admin only)
 * GET /api/counsel/admin/counselors
 */
router.get('/admin/counselors', async (_req: Request, res: Response) => {
  try {
    const counselors = await getAllCounselors();
    res.json({ success: true, counselors });
  } catch (error) {
    console.error('❌ Error fetching counselors:', error);
    res.status(500).json({ error: 'Failed to fetch counselors' });
  }
});

/**
 * Approve a counselor application (admin only)
 * POST /api/counsel/admin/approve/:counselorId
 */
router.post('/admin/approve/:counselorId', async (req: Request, res: Response) => {
  try {
    const { counselorId } = req.params;
    const { adminEmail } = req.body;

    if (!adminEmail) {
      return res.status(400).json({ error: 'Admin email required' });
    }

    const success = await approveCounselor(counselorId, adminEmail);

    if (!success) {
      return res.status(400).json({ error: 'Failed to approve counselor' });
    }

    res.json({ success: true, message: 'Counselor approved successfully' });
  } catch (error) {
    console.error('❌ Error approving counselor:', error);
    res.status(500).json({ error: 'Failed to approve counselor' });
  }
});

/**
 * Reject a counselor application (admin only)
 * POST /api/counsel/admin/reject/:counselorId
 */
router.post('/admin/reject/:counselorId', async (req: Request, res: Response) => {
  try {
    const { counselorId } = req.params;
    const { adminEmail, reason } = req.body;

    if (!adminEmail || !reason) {
      return res.status(400).json({ error: 'Admin email and rejection reason required' });
    }

    const success = await rejectCounselor(counselorId, adminEmail, reason);

    if (!success) {
      return res.status(400).json({ error: 'Failed to reject counselor' });
    }

    res.json({ success: true, message: 'Counselor application rejected' });
  } catch (error) {
    console.error('❌ Error rejecting counselor:', error);
    res.status(500).json({ error: 'Failed to reject counselor' });
  }
});

/**
 * Set counselor online status
 * POST /api/counsel/counselor/online
 */
router.post('/counselor/online', async (req: Request, res: Response) => {
  try {
    const { userId, name, email, phone, isOnline, state } = req.body;

    if (!userId || !name || !email || typeof isOnline !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields: userId, name, email, isOnline' });
    }

    const success = await setCounselorOnlineStatus(
      userId, 
      isOnline, 
      name, 
      email,
      phone,
      state as StateCode
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to update online status' });
    }

    res.json({ 
      success: true, 
      message: `You are now ${isOnline ? 'online and can receive requests' : 'offline'}` 
    });
  } catch (error) {
    console.error('❌ Error updating online status:', error);
    res.status(500).json({ error: 'Failed to update online status' });
  }
});

/**
 * Get online counselors
 * GET /api/counsel/counselors/online
 */
router.get('/counselors/online', async (_req: Request, res: Response) => {
  try {
    const counselors = await getOnlineCounselors();
    res.json({ success: true, counselors, count: counselors.length });
  } catch (error) {
    console.error('❌ Error fetching online counselors:', error);
    res.status(500).json({ error: 'Failed to fetch online counselors' });
  }
});

/**
 * Get available counselors for a state
 * GET /api/counsel/counselors/available/:state
 */
router.get('/counselors/available/:state', async (req: Request, res: Response) => {
  try {
    const { state } = req.params;
    const counselors = await getAvailableCounselorsForState(state as StateCode);
    res.json({ success: true, counselors, count: counselors.length });
  } catch (error) {
    console.error('❌ Error fetching available counselors:', error);
    res.status(500).json({ error: 'Failed to fetch counselors' });
  }
});

/**
 * Get counselor by user ID
 * GET /api/counsel/counselor/:userId
 */
router.get('/counselor/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const counselor = await getCounselor(userId);

    if (!counselor) {
      return res.status(404).json({ error: 'Counselor not found' });
    }

    res.json({ success: true, counselor });
  } catch (error) {
    console.error('❌ Error fetching counselor:', error);
    res.status(500).json({ error: 'Failed to fetch counselor' });
  }
});

export default router;
