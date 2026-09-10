import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  fetchAdminMandapams,
  fetchAdminMandapamById,
  updateAdminMandapam,
  approveAdminMandapam,
  rejectAdminMandapam,
  verifyAdminMandapam,
  featureAdminMandapam,
  deleteAdminMandapam,
  adminLogout,
  checkAdminAuth,
  AdminMandapam,
} from '../../services/adminApi';
import { Badge } from '../../components/ui/Badge';

export function AdminDashboardPage() {
  const [mandapams, setMandapams] = useState<AdminMandapam[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [adminEmail, setAdminEmail] = useState<string>('admin');
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit Modal State
  const [editingMandapam, setEditingMandapam] = useState<AdminMandapam | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    area: '',
    address: '',
    description: '',
    latitude: '',
    longitude: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Detail / Image Inspection Modal
  const [inspectingMandapam, setInspectingMandapam] = useState<AdminMandapam | null>(null);
  const [isLoadingInspect, setIsLoadingInspect] = useState(false);

  const navigate = useNavigate();

  // Load admin user profile
  useEffect(() => {
    checkAdminAuth().then((res) => {
      if (res.email) setAdminEmail(res.email);
    });
  }, []);

  // Fetch list of mandapams for the current tab
  const loadMandapams = useCallback(async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await fetchAdminMandapams(activeTab);
      setMandapams(data);
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch mandapams.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadMandapams();
  }, [loadMandapams]);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const handleApprove = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    const res = await approveAdminMandapam(id);
    if (res.success) {
      setActionSuccess('Mandapam approved successfully and is now publicly live!');
      loadMandapams();
    } else {
      setActionError(res.error || 'Failed to approve mandapam.');
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    const res = await rejectAdminMandapam(id);
    if (res.success) {
      setActionSuccess('Mandapam rejected.');
      loadMandapams();
    } else {
      setActionError(res.error || 'Failed to reject mandapam.');
    }
  };

  const handleToggleVerified = async (m: AdminMandapam) => {
    setActionError(null);
    setActionSuccess(null);
    const res = await verifyAdminMandapam(m.id, !m.is_verified);
    if (res.success) {
      setActionSuccess(`Verification status updated for ${m.name}.`);
      loadMandapams();
    } else {
      setActionError(res.error || 'Failed to update verification status.');
    }
  };

  const handleToggleFeatured = async (m: AdminMandapam) => {
    setActionError(null);
    setActionSuccess(null);
    const res = await featureAdminMandapam(m.id, !m.is_featured);
    if (res.success) {
      setActionSuccess(`Featured status updated for ${m.name}.`);
      loadMandapams();
    } else {
      setActionError(res.error || 'Failed to update featured status.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    const res = await deleteAdminMandapam(id);
    if (res.success) {
      setActionSuccess(`Deleted "${name}".`);
      loadMandapams();
    } else {
      setActionError(res.error || 'Failed to delete mandapam.');
    }
  };

  const openInspectModal = async (id: string) => {
    setIsLoadingInspect(true);
    const detailed = await fetchAdminMandapamById(id);
    setIsLoadingInspect(false);
    if (detailed) {
      setInspectingMandapam(detailed);
    }
  };

  const openEditModal = (m: AdminMandapam) => {
    setEditingMandapam(m);
    setEditForm({
      name: m.name,
      area: m.area,
      address: m.address || '',
      description: m.description || '',
      latitude: m.latitude.toString(),
      longitude: m.longitude.toString(),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMandapam) return;

    setIsSavingEdit(true);
    const res = await updateAdminMandapam(editingMandapam.id, {
      name: editForm.name.trim(),
      area: editForm.area.trim(),
      address: editForm.address.trim() || null,
      description: editForm.description.trim() || null,
      latitude: parseFloat(editForm.latitude),
      longitude: parseFloat(editForm.longitude),
    });
    setIsSavingEdit(false);

    if (res.success) {
      setActionSuccess(`Updated "${editForm.name}".`);
      setEditingMandapam(null);
      loadMandapams();
    } else {
      setActionError(res.error || 'Failed to save changes.');
    }
  };

  return (
    <div className="admin-dashboard-page">
      {/* ── TOP NAV ────────────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-logo" aria-hidden="true">🕉️</span>
            <span className="header-name">
              <span className="header-name-main">Ganesh Darshan</span>
              <span className="header-name-sub">Admin Moderation Console</span>
            </span>
          </div>

          <div className="admin-header-actions">
            <span className="admin-user-badge">👤 {adminEmail}</span>
            <Link to="/" className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
              🌐 View Public Site
            </Link>
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD ─────────────────────────────────────────────────── */}
      <main className="container admin-container">
        <div className="admin-title-row">
          <div>
            <h1 className="admin-title">Mandapam Moderation Queue</h1>
            <p className="admin-subtitle">Review, edit, approve, or reject submissions across Hyderabad.</p>
          </div>
          <button type="button" onClick={loadMandapams} className="btn btn-outline btn-sm">
            🔄 Refresh
          </button>
        </div>

        {/* Action Banners */}
        {actionSuccess && (
          <div className="admin-banner-success" role="status">
            ✓ {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="submit-banner-error" role="alert">
            ⚠️ {actionError}
          </div>
        )}

        {/* Status Tabs */}
        <div className="admin-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pending'}
            className={`admin-tab ${activeTab === 'pending' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            ⏳ Pending Submissions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'approved'}
            className={`admin-tab ${activeTab === 'approved' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            ✅ Approved Listings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rejected'}
            className={`admin-tab ${activeTab === 'rejected' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            ❌ Rejected
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`admin-tab ${activeTab === 'all' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📁 All Records
          </button>
        </div>

        {/* Records Listing */}
        {isLoading ? (
          <div className="empty-state" style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="empty-state-icon">⏳</span>
            <p className="empty-state-text">Loading moderation records…</p>
          </div>
        ) : mandapams.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎉</span>
            <p className="empty-state-text">No {activeTab} mandapams in this queue.</p>
          </div>
        ) : (
          <div className="admin-grid">
            {mandapams.map((m) => (
              <div key={m.id} className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-badges">
                    <span className={`admin-status-badge admin-status-${m.status}`}>
                      {m.status.toUpperCase()}
                    </span>
                    {m.is_verified && <Badge variant="verified">✓ Verified</Badge>}
                    {m.is_featured && <Badge variant="featured">⭐ Featured</Badge>}
                  </div>
                  <span className="admin-date">
                    {new Date(m.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="admin-card-content">
                  <h3 className="admin-card-title">{m.name}</h3>
                  <p className="admin-card-area">📍 {m.area}, Hyderabad</p>
                  {m.address && <p className="admin-card-address">{m.address}</p>}
                  {m.description && <p className="admin-card-desc">{m.description}</p>}
                  <p className="admin-card-coords">
                    🗺️ {m.latitude.toFixed(5)}, {m.longitude.toFixed(5)}
                  </p>
                  {m.image_url && (
                    <p className="admin-image-status">
                      📷 Image Attached: <code className="admin-code">{m.image_url}</code>
                    </p>
                  )}
                </div>

                {/* Card Action Controls */}
                <div className="admin-card-actions">
                  <button
                    type="button"
                    onClick={() => openInspectModal(m.id)}
                    className="btn btn-outline btn-sm"
                  >
                    🔍 Inspect / Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️ Edit
                  </button>

                  {m.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(m.id)}
                        className="btn btn-primary btn-sm admin-btn-approve"
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(m.id)}
                        className="btn btn-outline btn-sm admin-btn-reject"
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {m.status === 'approved' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleVerified(m)}
                        className="btn btn-ghost btn-sm"
                      >
                        {m.is_verified ? 'Unverify' : '✓ Verify'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(m)}
                        className="btn btn-ghost btn-sm"
                      >
                        {m.is_featured ? 'Unfeature' : '⭐ Feature'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(m.id)}
                        className="btn btn-outline btn-sm admin-btn-reject"
                      >
                        ✕ Revoke
                      </button>
                    </>
                  )}

                  {m.status === 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(m.id)}
                      className="btn btn-primary btn-sm admin-btn-approve"
                    >
                      ✓ Approve
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(m.id, m.name)}
                    className="btn btn-ghost btn-sm text-red-600 admin-btn-delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── INSPECT MODAL (WITH SIGNED IMAGE) ──────────────────────────────── */}
      {inspectingMandapam && (
        <div className="admin-modal-overlay" onClick={() => setInspectingMandapam(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Inspect Submission: {inspectingMandapam.name}</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setInspectingMandapam(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {inspectingMandapam.signed_image_url ? (
                <div className="admin-inspect-image-frame">
                  <img
                    src={inspectingMandapam.signed_image_url}
                    alt={inspectingMandapam.name}
                    className="admin-inspect-img"
                  />
                  <span className="admin-signed-badge">🔒 Secure Signed URL (5-min expiry)</span>
                </div>
              ) : inspectingMandapam.image_url ? (
                <div className="admin-inspect-no-image">
                  <span>📷 Object path: {inspectingMandapam.image_url}</span>
                  <p className="text-xs text-muted">Signed URL unavailable or storage object unreachable.</p>
                </div>
              ) : (
                <div className="admin-inspect-no-image">
                  <span style={{ fontSize: '3rem' }}>🕉️</span>
                  <p>No photo was uploaded with this submission.</p>
                </div>
              )}

              <div className="admin-inspect-details">
                <p><strong>Area:</strong> {inspectingMandapam.area}</p>
                <p><strong>Address:</strong> {inspectingMandapam.address || 'Not provided'}</p>
                <p><strong>Description:</strong> {inspectingMandapam.description || 'Not provided'}</p>
                <p><strong>Coordinates:</strong> {inspectingMandapam.latitude}, {inspectingMandapam.longitude}</p>
                <p><strong>Status:</strong> {inspectingMandapam.status}</p>
                <p><strong>Submitted:</strong> {new Date(inspectingMandapam.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setInspectingMandapam(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────── */}
      {editingMandapam && (
        <div className="admin-modal-overlay" onClick={() => setEditingMandapam(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit Mandapam Metadata</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditingMandapam(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="admin-edit-form">
              <div className="form-group">
                <label className="form-label">Mandapam Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Area / Locality *</label>
                <input
                  type="text"
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingMandapam(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn btn-primary"
                  aria-busy={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
