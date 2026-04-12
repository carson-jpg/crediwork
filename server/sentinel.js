/**
 * sentinel.js — Crediwork × Sentinel Watch Integration
 * ─────────────────────────────────────────────────────
 * Drop this file in your /server folder.
 * It uses @isava/sentinel-sdk to send security & business events
 * from Crediwork to Sentinel Watch in real time.
 *
 * Every function is safe — it NEVER throws or crashes your server.
 * All Sentinel calls are fire-and-forget with silent error handling.
 */

import SentinelClient from '@isava/sentinel-sdk';
import os from 'os';

// ─── Config (reads from your server .env) ─────────────────────────────────────

const SENTINEL_URL      = process.env.SENTINEL_URL      || 'http://localhost:5000/api';
const SENTINEL_EMAIL    = process.env.SENTINEL_EMAIL    || '';
const SENTINEL_PASSWORD = process.env.SENTINEL_PASSWORD || '';
const SENTINEL_TOKEN    = process.env.SENTINEL_TOKEN    || null;
const SENTINEL_SYSTEM_ID = process.env.SENTINEL_SYSTEM_ID || null;
const SENTINEL_ORG_ID   = process.env.SENTINEL_ORG_ID  || null;

// ─── Internal state ───────────────────────────────────────────────────────────

let client   = null;
let systemId = SENTINEL_SYSTEM_ID;
let orgId    = SENTINEL_ORG_ID;
let ready    = false;

// Brute-force tracker  { "ip:email" → { count, timer } }
const loginFailMap = new Map();

// Withdrawal rate tracker  { userId → [timestamps] }
const withdrawalTracker = new Map();

// Error spike tracker
let errorCount = 0;
let errorSpikeTimer = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initSentinel() {
  if (!SENTINEL_URL || (!SENTINEL_TOKEN && (!SENTINEL_EMAIL || !SENTINEL_PASSWORD))) {
    console.log('[Sentinel] ⚠️  Skipping — SENTINEL_URL and credentials not set in .env');
    return;
  }

  console.log('[Sentinel] Connecting to Sentinel Watch at', SENTINEL_URL);

  client = new SentinelClient({
    baseUrl:    SENTINEL_URL,
    token:      SENTINEL_TOKEN || undefined,
    maxRetries: 2,
    debug:      false,
  });

  // ── Authenticate ─────────────────────────────────────────────────────────
  if (!SENTINEL_TOKEN) {
    try {
      const { user, token } = await client.auth.login(SENTINEL_EMAIL, SENTINEL_PASSWORD);
      orgId = user.organizationId;
      console.log(`[Sentinel] ✓ Authenticated — ${user.email} (${user.role})`);
      console.log(`[Sentinel]   Save token to skip re-login: SENTINEL_TOKEN=${token}`);
    } catch (err) {
      console.error('[Sentinel] ✗ Auth failed:', err.message);
      console.error('[Sentinel]   Set SENTINEL_EMAIL + SENTINEL_PASSWORD in server/.env');
      return;
    }
  } else {
    try {
      const me = await client.auth.me();
      orgId = me.organizationId;
      console.log(`[Sentinel] ✓ Token valid — ${me.email}`);
    } catch (err) {
      console.error('[Sentinel] ✗ Token invalid:', err.message);
      return;
    }
  }

  // ── Register Crediwork as a monitored System ──────────────────────────────
  if (!systemId) {
    await _registerSystem();
  } else {
    console.log(`[Sentinel] ✓ Using system: ${systemId}`);
  }

  // ── Start heartbeat (CPU/memory every 60s) ────────────────────────────────
  _startHeartbeat();

  ready = true;
  console.log('[Sentinel] ✓ Crediwork is now monitored by Sentinel Watch');
  console.log('[Sentinel]   System ID:', systemId);
  console.log('[Sentinel]   View live alerts in your Sentinel Watch dashboard');
}

// ─── Register system ──────────────────────────────────────────────────────────

async function _registerSystem() {
  const systemName = `Crediwork — ${os.hostname()}`;
  try {
    // Check if already registered
    const existing = await client.systems.list({ name: systemName });
    if (existing.data?.length > 0) {
      systemId = existing.data[0]._id;
      console.log(`[Sentinel] ✓ Found existing system: ${systemId}`);
      return;
    }
  } catch { /* continue to create */ }

  try {
    const system = await client.systems.create({
      name:           systemName,
      hostname:       os.hostname(),
      ip:             _localIp(),
      type:           'server',
      os:             `${os.type()} ${os.release()}`,
      status:         'online',
      organizationId: orgId,
      tags:           ['crediwork', 'task-platform', 'mpesa', 'kenya'],
      metrics:        { cpu: 0, memory: 0, disk: 0 },
    });
    systemId = system._id;
    console.log(`[Sentinel] ✓ System registered: ${systemId}`);
    console.log(`[Sentinel]   Add to server/.env: SENTINEL_SYSTEM_ID=${systemId}`);
  } catch (err) {
    console.error('[Sentinel] ✗ Could not register system:', err.message);
  }
}

// ─── Core alert sender ────────────────────────────────────────────────────────

async function _alert(opts) {
  if (!client) return; // Not initialized — skip silently
  try {
    await client.alerts.create({
      severity:        opts.severity,
      title:           opts.title,
      source:          opts.source || 'Crediwork',
      description:     opts.description || '',
      mitreId:         opts.mitreId || 'N/A',
      affectedAssets:  opts.affectedAssets || [],
      recommendations: opts.recommendations || [],
      organizationId:  orgId,
      systemId:        systemId,
      status:          'open',
    });
  } catch (err) {
    // Never crash Crediwork for a monitoring failure
    console.error('[Sentinel] ✗ Alert send failed:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API — call these from server.js
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Auth events ──────────────────────────────────────────────────────────────

/**
 * User logged in successfully.
 * Call after JWT is issued.
 *
 * @example  // After: res.json({ token, user })
 * await sentinel.onLoginSuccess(req, user);
 */
export async function onLoginSuccess(req, user) {
  const key = _loginKey(req, user.email);
  loginFailMap.delete(key); // Clear any previous fail streak

  // Only alert admin logins — user logins would be too noisy
  if (user.role === 'admin') {
    await _alert({
      severity:       'low',
      title:          `Admin Login — ${user.email}`,
      source:         'Crediwork Auth',
      description:    `Admin account '${user.firstName} ${user.lastName}' (${user.email}) logged in from IP ${_ip(req)} at ${new Date().toISOString()}.`,
      mitreId:        'T1078',
      affectedAssets: [user.email, _ip(req)],
      recommendations:['Verify this login was expected', 'Check for unusual activity after this session'],
    });
  }
}

/**
 * Login attempt failed (wrong password or user not found).
 * Automatically escalates to brute-force after 5 failures.
 *
 * @example  // After: return res.status(401).json({ error: 'Invalid credentials' })
 * await sentinel.onLoginFailed(req, email);
 */
export async function onLoginFailed(req, email) {
  const key   = _loginKey(req, email);
  const entry = loginFailMap.get(key) || { count: 0 };
  entry.count++;

  // Reset tracker after 10 min
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => loginFailMap.delete(key), 600_000);
  loginFailMap.set(key, entry);

  if (entry.count === 5) {
    // Brute-force threshold hit
    await _alert({
      severity:       'critical',
      title:          `Brute Force Detected — ${email}`,
      source:         'Crediwork Auth',
      description:    `5 consecutive failed login attempts for account '${email}' from IP ${_ip(req)}. Possible brute force or credential stuffing attack.`,
      mitreId:        'T1110',
      affectedAssets: [email, _ip(req)],
      recommendations:[
        'Block this IP address immediately',
        'Lock the account temporarily',
        'Notify the account holder',
        'Check if other accounts were targeted from this IP',
      ],
    });
    loginFailMap.delete(key); // Reset after alert
  } else if (entry.count === 1) {
    // First failure — low severity
    await _alert({
      severity:       'low',
      title:          `Failed Login — ${email}`,
      source:         'Crediwork Auth',
      description:    `Failed login for '${email}' from IP ${_ip(req)}. Attempt ${entry.count}.`,
      mitreId:        'T1110',
      affectedAssets: [email],
      recommendations:['Monitor for repeated attempts from this IP'],
    });
  }
}

/**
 * New user registered.
 *
 * @example  // After: res.status(201).json({ user, token })
 * await sentinel.onUserRegistered(req, newUser);
 */
export async function onUserRegistered(req, user) {
  await _alert({
    severity:       'low',
    title:          `New Registration — ${user.firstName} ${user.lastName} (Package ${user.package})`,
    source:         'Crediwork Auth',
    description:    `New user '${user.email}' registered with Package ${user.package} (KES ${user.packageAmount}/month, earning KES ${user.dailyEarning}/day). IP: ${_ip(req)}. Status: pending (awaiting payment & admin approval).`,
    mitreId:        'T1136',
    affectedAssets: [user.email, user.phone],
    recommendations:['Review KYC data when submitted', 'Monitor for duplicate registrations from same IP'],
  });
}

// ─── Payment events ───────────────────────────────────────────────────────────

/**
 * M-Pesa STK push initiated.
 *
 * @example  // After STK push request is sent
 * await sentinel.onPaymentInitiated(req, user, amount);
 */
export async function onPaymentInitiated(req, user, amount) {
  await _alert({
    severity:       'low',
    title:          `Payment Initiated — ${user.firstName} — KES ${amount}`,
    source:         'Crediwork M-Pesa',
    description:    `M-Pesa STK push of KES ${amount} initiated for '${user.email}' (Package ${user.package}). Phone: ${user.phone}. IP: ${_ip(req)}.`,
    mitreId:        'N/A',
    affectedAssets: [user.email, user.phone],
    recommendations:['No action needed unless multiple STK pushes for same user'],
  });
}

/**
 * M-Pesa payment completed successfully.
 *
 * @example  // In your M-Pesa callback when ResultCode === 0
 * await sentinel.onPaymentSuccess(user, amount, mpesaReceiptNumber);
 */
export async function onPaymentSuccess(user, amount, receiptNumber) {
  await _alert({
    severity:       'low',
    title:          `Payment Confirmed — ${user?.firstName || 'User'} — KES ${amount}`,
    source:         'Crediwork M-Pesa',
    description:    `M-Pesa payment of KES ${amount} confirmed. Receipt: ${receiptNumber}. User: ${user?.email}. Account activated.`,
    mitreId:        'N/A',
    affectedAssets: [user?.email, receiptNumber],
    recommendations:['No action needed'],
  });
}

/**
 * M-Pesa payment failed.
 *
 * @example  // In your M-Pesa callback when ResultCode !== 0
 * await sentinel.onPaymentFailed(user, amount, reason);
 */
export async function onPaymentFailed(user, amount, reason) {
  await _alert({
    severity:       'medium',
    title:          `Payment Failed — ${user?.firstName || 'User'} — KES ${amount}`,
    source:         'Crediwork M-Pesa',
    description:    `M-Pesa payment of KES ${amount} failed for '${user?.email}'. Reason: ${reason}.`,
    mitreId:        'N/A',
    affectedAssets: [user?.email],
    recommendations:['Contact user if payment fails repeatedly', 'Check M-Pesa integration logs'],
  });
}

// ─── Admin user management events ─────────────────────────────────────────────

/**
 * Admin approved a user account.
 *
 * @example  // After: await User.findByIdAndUpdate(userId, { status: 'active' })
 * await sentinel.onUserApproved(req, admin, approvedUser);
 */
export async function onUserApproved(req, admin, approvedUser) {
  await _alert({
    severity:       'low',
    title:          `User Approved — ${approvedUser.firstName} ${approvedUser.lastName}`,
    source:         'Crediwork Admin',
    description:    `Admin '${admin.email}' approved user '${approvedUser.email}' (Package ${approvedUser.package}). Account is now active. IP: ${_ip(req)}.`,
    mitreId:        'T1098',
    affectedAssets: [approvedUser.email, admin.email],
    recommendations:['Verify payment receipt before approval', 'Ensure KYC data is complete'],
  });
}

/**
 * Admin rejected a user account.
 *
 * @example  // After rejecting
 * await sentinel.onUserRejected(req, admin, rejectedUser, reason);
 */
export async function onUserRejected(req, admin, rejectedUser, reason) {
  await _alert({
    severity:       'medium',
    title:          `User Rejected — ${rejectedUser.firstName} ${rejectedUser.lastName}`,
    source:         'Crediwork Admin',
    description:    `Admin '${admin.email}' rejected user '${rejectedUser.email}'. Reason: ${reason || 'Not specified'}. IP: ${_ip(req)}.`,
    mitreId:        'N/A',
    affectedAssets: [rejectedUser.email, admin.email],
    recommendations:['Notify user with reason', 'Initiate refund if payment was made'],
  });
}

// ─── Withdrawal events ────────────────────────────────────────────────────────

/**
 * User submitted a withdrawal request.
 * Alerts on suspicious patterns (multiple withdrawals in short time).
 *
 * @example  // After: await withdrawal.save()
 * await sentinel.onWithdrawalRequested(req, user, amount, paymentMethod);
 */
export async function onWithdrawalRequested(req, user, amount, paymentMethod) {
  // Track withdrawal rate per user
  const now = Date.now();
  const uid = user._id.toString();
  const times = withdrawalTracker.get(uid) || [];
  const recentTimes = times.filter(t => now - t < 3600_000); // last 1 hour
  recentTimes.push(now);
  withdrawalTracker.set(uid, recentTimes);

  const severity = recentTimes.length >= 3
    ? 'high'   // 3+ withdrawal requests in 1 hour
    : amount >= 50000
    ? 'high'   // Very large withdrawal
    : amount >= 10000
    ? 'medium'
    : 'low';

  const isHighFrequency = recentTimes.length >= 3;
  const isLargeAmount   = amount >= 10000;

  let title = `Withdrawal Request — ${user.firstName} — KES ${amount.toLocaleString()}`;
  if (isHighFrequency) title = `⚠️ High Frequency Withdrawals — ${user.firstName} — KES ${amount.toLocaleString()}`;
  else if (isLargeAmount) title = `Large Withdrawal — ${user.firstName} — KES ${amount.toLocaleString()}`;

  await _alert({
    severity,
    title,
    source:         'Crediwork Withdrawals',
    description:    `User '${user.email}' (Package ${user.package}) requested withdrawal of KES ${amount.toLocaleString()} via ${paymentMethod}.${
      isHighFrequency ? ` ⚠️ This is their ${recentTimes.length}rd request in the last hour.` : ''
    }${isLargeAmount ? ` ⚠️ Amount exceeds KES 10,000.` : ''} IP: ${_ip(req)}.`,
    mitreId:        isHighFrequency || isLargeAmount ? 'T1657' : 'N/A',
    affectedAssets: [user.email, user.phone],
    recommendations: isHighFrequency
      ? ['Review all recent withdrawals for this user', 'Check wallet balance vs earnings', 'Verify account was not compromised']
      : isLargeAmount
      ? ['Verify the user legitimately earned this amount', 'Review task completion history']
      : ['Standard review before processing'],
  });
}

/**
 * Admin approved a withdrawal.
 *
 * @example  // After: withdrawal.status = 'approved'
 * await sentinel.onWithdrawalApproved(req, admin, withdrawal, user);
 */
export async function onWithdrawalApproved(req, admin, withdrawal, user) {
  await _alert({
    severity:       'low',
    title:          `Withdrawal Approved — ${user?.firstName || 'User'} — KES ${withdrawal.amount?.toLocaleString()}`,
    source:         'Crediwork Admin',
    description:    `Admin '${admin.email}' approved withdrawal of KES ${withdrawal.amount?.toLocaleString()} for '${user?.email}' via ${withdrawal.paymentMethod}. IP: ${_ip(req)}.`,
    mitreId:        'N/A',
    affectedAssets: [user?.email, admin.email],
    recommendations:['Process payment promptly', 'Keep payment receipt for records'],
  });
}

/**
 * Admin rejected a withdrawal.
 */
export async function onWithdrawalRejected(req, admin, withdrawal, user, reason) {
  await _alert({
    severity:       'medium',
    title:          `Withdrawal Rejected — ${user?.firstName || 'User'} — KES ${withdrawal.amount?.toLocaleString()}`,
    source:         'Crediwork Admin',
    description:    `Admin '${admin.email}' rejected withdrawal of KES ${withdrawal.amount?.toLocaleString()} for '${user?.email}'. Reason: ${reason || 'Not specified'}. IP: ${_ip(req)}.`,
    mitreId:        'N/A',
    affectedAssets: [user?.email, admin.email],
    recommendations:['Notify user with reason and next steps', 'Restore balance to wallet if already deducted'],
  });
}

// ─── Task events ──────────────────────────────────────────────────────────────

/**
 * Admin approved a task submission (user earns reward).
 *
 * @example  // After approving submission
 * await sentinel.onTaskApproved(req, admin, submission, reward);
 */
export async function onTaskApproved(req, admin, submission, reward) {
  await _alert({
    severity:       'low',
    title:          `Task Approved — Reward KES ${reward} credited`,
    source:         'Crediwork Tasks',
    description:    `Admin '${admin.email}' approved task submission by user '${submission.userId}'. Reward: KES ${reward} added to wallet.`,
    mitreId:        'N/A',
    affectedAssets: [submission.userId?.toString()],
    recommendations:['No action needed'],
  });
}

/**
 * Admin rejected a task submission.
 */
export async function onTaskRejected(req, admin, submission, reason) {
  await _alert({
    severity:       'low',
    title:          `Task Rejected — ${reason || 'No reason given'}`,
    source:         'Crediwork Tasks',
    description:    `Admin '${admin.email}' rejected task submission by user '${submission.userId}'. Reason: ${reason || 'Not specified'}.`,
    mitreId:        'N/A',
    affectedAssets: [submission.userId?.toString()],
    recommendations:['Notify user with clear reason and instructions to resubmit'],
  });
}

// ─── Security events ──────────────────────────────────────────────────────────

/**
 * A request hit a route that requires admin but the user isn't admin.
 *
 * @example  // In requireAdmin middleware when check fails
 * await sentinel.onUnauthorizedAdminAccess(req);
 */
export async function onUnauthorizedAdminAccess(req) {
  await _alert({
    severity:       'high',
    title:          `Unauthorized Admin Access Attempt — ${req.path}`,
    source:         'Crediwork Security',
    description:    `Non-admin user '${_userEmail(req)}' attempted to access admin route '${req.method} ${req.path}' from IP ${_ip(req)}.`,
    mitreId:        'T1078.004',
    affectedAssets: [req.path, _userEmail(req), _ip(req)],
    recommendations:[
      'Check if this is a compromised account',
      'Review the user role assignment',
      'Monitor this IP for further probing attempts',
    ],
  });
}

/**
 * Server threw a 500 error. Tracks rate and alerts on spike.
 *
 * @example  // In your Express error handler
 * app.use((err, req, res, next) => {
 *   sentinel.onServerError(req, err);
 *   res.status(500).json({ error: 'Internal server error' });
 * });
 */
export async function onServerError(req, err) {
  errorCount++;

  if (!errorSpikeTimer) {
    errorSpikeTimer = setTimeout(async () => {
      const count  = errorCount;
      errorCount   = 0;
      errorSpikeTimer = null;

      if (count >= 10) {
        await _alert({
          severity:       count >= 30 ? 'critical' : 'high',
          title:          `Error Spike — ${count} server errors in 60 seconds`,
          source:         'Crediwork Application',
          description:    `${count} internal server errors occurred in the last 60 seconds. Latest: ${err?.message || 'Unknown error'} at ${req?.path}.`,
          mitreId:        'N/A',
          affectedAssets: [os.hostname()],
          recommendations:[
            'Check application logs immediately',
            'Check MongoDB connection',
            'Check M-Pesa API connectivity',
            'Restart server if necessary',
          ],
        });
      }
    }, 60_000);
  }
}

/**
 * Send any custom alert from anywhere in Crediwork.
 *
 * @example
 * await sentinel.custom({
 *   severity: 'high',
 *   title: 'Suspicious task submission spike',
 *   description: '47 task submissions in 5 minutes from single user',
 * });
 */
export async function custom(opts) {
  await _alert(opts);
}

// ─── Heartbeat (server metrics) ───────────────────────────────────────────────

async function _updateMetrics() {
  if (!systemId || !client) return;

  const cpus   = os.cpus();
  const cpu    = Math.round(cpus.reduce((sum, c) => {
    const total = Object.values(c.times).reduce((a, b) => a + b, 0);
    return sum + ((total - c.times.idle) / total) * 100;
  }, 0) / cpus.length);

  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  const memory   = Math.round(((totalMem - freeMem) / totalMem) * 100);

  try {
    await client.systems.update(systemId, {
      status:  'online',
      metrics: { cpu, memory, disk: 0 },
    });
  } catch { /* silent */ }

  if (cpu > 85) {
    await _alert({
      severity:       cpu > 95 ? 'critical' : 'high',
      title:          `Crediwork Server — CPU at ${cpu}%`,
      source:         'System Monitor',
      description:    `Server CPU usage is critically high at ${cpu}%. This will impact M-Pesa payment processing and user experience.`,
      mitreId:        'N/A',
      affectedAssets: [os.hostname()],
      recommendations:['Check for runaway processes', 'Review recent deployments', 'Consider scaling'],
    });
  }

  if (memory > 88) {
    await _alert({
      severity:       memory > 95 ? 'critical' : 'high',
      title:          `Crediwork Server — Memory at ${memory}%`,
      source:         'System Monitor',
      description:    `Server memory at ${memory}%. Free: ${Math.round(freeMem / 1024 / 1024)}MB. Risk of OOM crash.`,
      mitreId:        'N/A',
      affectedAssets: [os.hostname()],
      recommendations:['Restart application if needed', 'Check for memory leaks in M-Pesa polling or cron jobs'],
    });
  }
}

function _startHeartbeat() {
  _updateMetrics(); // immediate
  setInterval(_updateMetrics, 60_000);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function _ip(req) {
  return (
    req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req?.connection?.remoteAddress ||
    req?.ip ||
    'unknown'
  );
}

function _userEmail(req) {
  return req?.user?.email || req?.user?._id?.toString() || 'anonymous';
}

function _loginKey(req, email) {
  return `${_ip(req)}:${email}`;
}

function _localIp() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

// Default export with all functions
const sentinel = {
  init:                      initSentinel,
  onLoginSuccess,
  onLoginFailed,
  onUserRegistered,
  onPaymentInitiated,
  onPaymentSuccess,
  onPaymentFailed,
  onUserApproved,
  onUserRejected,
  onWithdrawalRequested,
  onWithdrawalApproved,
  onWithdrawalRejected,
  onTaskApproved,
  onTaskRejected,
  onUnauthorizedAdminAccess,
  onServerError,
  custom,
};

export default sentinel;
