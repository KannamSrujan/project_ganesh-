import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  AdminMandapam
} from '../../services/adminApi'
import { Badge } from '../../components/ui/Badge'

export function AdminDashboardPage () {
  const [mandapams, setMandapams] = useState<AdminMandapam[]>([])
  const [activeTab, setActiveTab] = useState<
    'pending' | 'approved' | 'rejected' | 'all'
  >('pending')
  const [adminEmail, setAdminEmail] = useState<string>('admin')
  const [isLoading, setIsLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Edit Modal State
  const [editingMandapam, setEditingMandapam] = useState<AdminMandapam | null>(
    null
  )
  const [editForm, setEditForm] = useState({
    name: '',
    area: '',
    address: '',
    description: '',
    latitude: '',
    longitude: ''
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Detail / Image Inspection Modal
  const [inspectingMandapam, setInspectingMandapam] =
    useState<AdminMandapam | null>(null)
  const [isLoadingInspect, setIsLoadingInspect] = useState(false)

  const navigate = useNavigate()

  // Load admin user profile
  useEffect(() => {
    checkAdminAuth().then(res => {
      if (res.email) setAdminEmail(res.email)
    })
  }, [])

  // Fetch list of mandapams for the current tab
  const loadMandapams = useCallback(async () => {
    setIsLoading(true)
    setActionError(null)
    try {
      const data = await fetchAdminMandapams(activeTab)
      setMandapams(data)
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch mandapams.')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadMandapams()
  }, [loadMandapams])

  const handleLogout = async () => {
    await adminLogout()
    navigate('/admin/login', { replace: true })
  }

  const handleApprove = async (id: string) => {
    setActionError(null)
    setActionSuccess(null)
    const res = await approveAdminMandapam(id)
    if (res.success) {
      setActionSuccess(
        'Mandapam approved successfully and is now publicly live!'
      )
      loadMandapams()
    } else {
      setActionError(res.error || 'Failed to approve mandapam.')
    }
  }

  const handleReject = async (id: string) => {
    setActionError(null)
    setActionSuccess(null)
    const res = await rejectAdminMandapam(id)
    if (res.success) {
      setActionSuccess('Mandapam rejected.')
      loadMandapams()
    } else {
      setActionError(res.error || 'Failed to reject mandapam.')
    }
  }

  const handleToggleVerified = async (m: AdminMandapam) => {
    setActionError(null)
    setActionSuccess(null)
    const res = await verifyAdminMandapam(m.id, !m.is_verified)
    if (res.success) {
      setActionSuccess(`Verification status updated for ${m.name}.`)
      loadMandapams()
    } else {
      setActionError(res.error || 'Failed to update verification status.')
    }
  }

  const handleToggleFeatured = async (m: AdminMandapam) => {
    setActionError(null)
    setActionSuccess(null)
    const res = await featureAdminMandapam(m.id, !m.is_featured)
    if (res.success) {
      setActionSuccess(`Featured status updated for ${m.name}.`)
      loadMandapams()
    } else {
      setActionError(res.error || 'Failed to update featured status.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`
      )
    ) {
      return
    }
    setActionError(null)
    setActionSuccess(null)
    const res = await deleteAdminMandapam(id)
    if (res.success) {
      setActionSuccess(`Deleted "${name}".`)
      loadMandapams()
    } else {
      setActionError(res.error || 'Failed to delete mandapam.')
    }
  }

  const openInspectModal = async (id: string) => {
    setIsLoadingInspect(true)
    const detailed = await fetchAdminMandapamById(id)
    setIsLoadingInspect(false)
    if (detailed) {
      setInspectingMandapam(detailed)
    }
  }

  const openEditModal = (m: AdminMandapam) => {
    setEditingMandapam(m)
    setEditForm({
      name: m.name,
      area: m.area,
      address: m.address || '',
      description: m.description || '',
      latitude: m.latitude.toString(),
      longitude: m.longitude.toString()
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMandapam) return

    setIsSavingEdit(true)
    const res = await updateAdminMandapam(editingMandapam.id, {
      name: editForm.name.trim(),
      area: editForm.area.trim(),
      address: editForm.address.trim() || null,
      description: editForm.description.trim() || null,
      latitude: parseFloat(editForm.latitude),
      longitude: parseFloat(editForm.longitude)
    })
    setIsSavingEdit(false)

    if (res.success) {
      setActionSuccess(`Updated "${editForm.name}".`)
      setEditingMandapam(null)
      loadMandapams()
    } else {
      setActionError(res.error || 'Failed to save changes.')
    }
  }

  return (
    <div className='min-h-screen bg-[var(--color-surface-muted)]'>
      <header className='sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-sm'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
          <div className='flex shrink-0 items-center gap-3'>
            <span className='text-2xl leading-none' aria-hidden='true'>
              🕉️
            </span>
            <span className='flex flex-col leading-none'>
              <span className='text-base font-bold text-[var(--color-text)]'>
                Ganesh Darshan
              </span>
              <span className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-dark)]'>
                Admin Moderation Console
              </span>
            </span>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <span className='rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]'>
              👤 {adminEmail}
            </span>
            <Link
              to='/'
              className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
              target='_blank'
              rel='noopener noreferrer'
            >
              🌐 View Public Site
            </Link>
            <button
              type='button'
              onClick={handleLogout}
              className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl'>
              Mandapam Moderation Queue
            </h1>
            <p className='mt-1 text-sm text-[var(--color-text-secondary)]'>
              Review, edit, approve, or reject submissions across Hyderabad.
            </p>
          </div>
          <button
            type='button'
            onClick={() => loadMandapams()}
            className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
          >
            🔄 Refresh
          </button>
        </div>

        {actionSuccess && (
          <div
            className='mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700'
            role='status'
          >
            ✓ {actionSuccess}
          </div>
        )}
        {actionError && (
          <div
            className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
            role='alert'
          >
            ⚠️ {actionError}
          </div>
        )}

        <div className='mb-5 flex gap-2 overflow-x-auto pb-1' role='tablist'>
          {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              type='button'
              role='tab'
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
                activeTab === tab
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
              ].join(' ')}
            >
              {tab === 'pending' && '⏳ Pending Submissions'}
              {tab === 'approved' && '✅ Approved Listings'}
              {tab === 'rejected' && '❌ Rejected'}
              {tab === 'all' && '📁 All Records'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-text-secondary)]'>
            <span className='text-5xl opacity-70' aria-hidden='true'>
              ⏳
            </span>
            <p className='text-base font-medium'>Loading moderation records…</p>
          </div>
        ) : mandapams.length === 0 ? (
          <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-text-secondary)]'>
            <span className='text-5xl opacity-70' aria-hidden='true'>
              🎉
            </span>
            <p className='text-base font-medium'>
              No {activeTab} mandapams in this queue.
            </p>
          </div>
        ) : (
          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {mandapams.map(m => (
              <div
                key={m.id}
                className='flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 transition'
              >
                <div className='mb-4 flex items-start justify-between gap-3'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]',
                        m.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : m.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      ].join(' ')}
                    >
                      {m.status}
                    </span>
                    {m.is_verified && (
                      <Badge variant='verified'>✓ Verified</Badge>
                    )}
                    {m.is_featured && (
                      <Badge variant='featured'>⭐ Featured</Badge>
                    )}
                  </div>
                  <span className='text-xs text-stone-400'>
                    {new Date(m.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className='flex flex-1 flex-col gap-2'>
                  <h3 className='text-lg font-bold text-[var(--color-text)]'>
                    {m.name}
                  </h3>
                  <p className='text-sm font-semibold text-[var(--color-primary-dark)]'>
                    📍 {m.area}, Hyderabad
                  </p>
                  {m.address && (
                    <p className='text-sm text-[var(--color-text-secondary)]'>
                      {m.address}
                    </p>
                  )}
                  {m.description && (
                    <p className='text-sm leading-6 text-[var(--color-text-secondary)]'>
                      {m.description}
                    </p>
                  )}
                  <p className='text-xs text-[var(--color-text-muted)]'>
                    🗺️ {m.latitude.toFixed(5)}, {m.longitude.toFixed(5)}
                  </p>
                  {m.image_url && (
                    <p className='text-xs text-[var(--color-text-muted)]'>
                      📷 Image Attached:{' '}
                      <code className='rounded bg-[var(--color-surface-muted)] px-1 py-0.5 text-[11px]'>
                        {m.image_url}
                      </code>
                    </p>
                  )}
                </div>

                <div className='mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4'>
                  <button
                    type='button'
                    onClick={() => openInspectModal(m.id)}
                    className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
                  >
                    🔍 Inspect / Photo
                  </button>
                  <button
                    type='button'
                    onClick={() => openEditModal(m)}
                    className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
                  >
                    ✏️ Edit
                  </button>

                  {m.status === 'pending' && (
                    <>
                      <button
                        type='button'
                        onClick={() => handleApprove(m.id)}
                        className='inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700'
                      >
                        ✓ Approve
                      </button>
                      <button
                        type='button'
                        onClick={() => handleReject(m.id)}
                        className='inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50'
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {m.status === 'approved' && (
                    <>
                      <button
                        type='button'
                        onClick={() => handleToggleVerified(m)}
                        className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
                      >
                        {m.is_verified ? 'Unverify' : '✓ Verify'}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleToggleFeatured(m)}
                        className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
                      >
                        {m.is_featured ? 'Unfeature' : '⭐ Feature'}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleReject(m.id)}
                        className='inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50'
                      >
                        ✕ Revoke
                      </button>
                    </>
                  )}

                  {m.status === 'rejected' && (
                    <button
                      type='button'
                      onClick={() => handleApprove(m.id)}
                      className='inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700'
                    >
                      ✓ Approve
                    </button>
                  )}

                  <button
                    type='button'
                    onClick={() => handleDelete(m.id, m.name)}
                    className='ml-auto inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50'
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {inspectingMandapam && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
          onClick={() => setInspectingMandapam(null)}
        >
          <div
            className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4'>
              <h2 className='text-lg font-bold text-[var(--color-text)]'>
                Inspect Submission: {inspectingMandapam.name}
              </h2>
              <button
                type='button'
                className='text-xl text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]'
                onClick={() => setInspectingMandapam(null)}
              >
                ✕
              </button>
            </div>

            <div className='space-y-4 p-5'>
              {inspectingMandapam.signed_image_url ? (
                <div className='relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]'>
                  <img
                    src={inspectingMandapam.signed_image_url}
                    alt={inspectingMandapam.name}
                    className='h-72 w-full object-contain bg-black'
                  />
                  <span className='absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold text-emerald-300'>
                    🔒 Secure Signed URL (5-min expiry)
                  </span>
                </div>
              ) : inspectingMandapam.image_url ? (
                <div className='rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-text-secondary)]'>
                  <span>📷 Object path: {inspectingMandapam.image_url}</span>
                  <p className='mt-2 text-xs text-[var(--color-text-muted)]'>
                    Signed URL unavailable or storage object unreachable.
                  </p>
                </div>
              ) : (
                <div className='rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-center text-[var(--color-text-secondary)]'>
                  <span className='block text-5xl'>🕉️</span>
                  <p className='mt-2'>
                    No photo was uploaded with this submission.
                  </p>
                </div>
              )}

              <div className='space-y-2 text-sm text-[var(--color-text-secondary)]'>
                <p>
                  <strong className='text-[var(--color-text)]'>Area:</strong>{' '}
                  {inspectingMandapam.area}
                </p>
                <p>
                  <strong className='text-[var(--color-text)]'>Address:</strong>{' '}
                  {inspectingMandapam.address || 'Not provided'}
                </p>
                <p>
                  <strong className='text-[var(--color-text)]'>
                    Description:
                  </strong>{' '}
                  {inspectingMandapam.description || 'Not provided'}
                </p>
                <p>
                  <strong className='text-[var(--color-text)]'>
                    Coordinates:
                  </strong>{' '}
                  {inspectingMandapam.latitude}, {inspectingMandapam.longitude}
                </p>
                <p>
                  <strong className='text-[var(--color-text)]'>Status:</strong>{' '}
                  {inspectingMandapam.status}
                </p>
                <p>
                  <strong className='text-[var(--color-text)]'>
                    Submitted:
                  </strong>{' '}
                  {new Date(inspectingMandapam.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className='flex justify-end border-t border-[var(--color-border)] px-5 py-4'>
              <button
                type='button'
                onClick={() => setInspectingMandapam(null)}
                className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingMandapam && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
          onClick={() => setEditingMandapam(null)}
        >
          <div
            className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4'>
              <h2 className='text-lg font-bold text-[var(--color-text)]'>
                Edit Mandapam Metadata
              </h2>
              <button
                type='button'
                className='text-xl text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]'
                onClick={() => setEditingMandapam(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className='space-y-4 p-5'>
              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Mandapam Name *
                </label>
                <input
                  type='text'
                  value={editForm.name}
                  onChange={e =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Area / Locality *
                </label>
                <input
                  type='text'
                  value={editForm.area}
                  onChange={e =>
                    setEditForm({ ...editForm, area: e.target.value })
                  }
                  required
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Address
                </label>
                <input
                  type='text'
                  value={editForm.address}
                  onChange={e =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <label className='text-sm font-bold text-[var(--color-text)]'>
                    Latitude *
                  </label>
                  <input
                    type='number'
                    step='any'
                    value={editForm.latitude}
                    onChange={e =>
                      setEditForm({ ...editForm, latitude: e.target.value })
                    }
                    required
                    className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-bold text-[var(--color-text)]'>
                    Longitude *
                  </label>
                  <input
                    type='number'
                    step='any'
                    value={editForm.longitude}
                    onChange={e =>
                      setEditForm({ ...editForm, longitude: e.target.value })
                    }
                    required
                    className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                  />
                </div>
              </div>

              <div className='flex justify-end gap-3 border-t border-[var(--color-border)] pt-4'>
                <button
                  type='button'
                  onClick={() => setEditingMandapam(null)}
                  className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSavingEdit}
                  className='inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60'
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
  )
}
