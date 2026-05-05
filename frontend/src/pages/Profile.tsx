import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfile } from '../api/profile'

const S = {
  card: { background: 'white', borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: '1px solid #f1f5f9' },
  label: { fontSize: '14px', color: '#64748b', fontWeight: 500 },
  value: { fontSize: '15px', color: '#1e293b', fontWeight: 500 },
  sectionHead: { padding: '16px 28px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#94a3b8', background: '#f8fafc' },
}

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getProfile()
      .then(({ data }) => setProfile(data.data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '16px', color: '#64748b' }}>
      Loading profile…
    </div>
  )

  if (notFound || !profile) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
      <div style={{ fontSize: '48px' }}>👤</div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f2444' }}>No Profile Yet</h2>
      <p style={{ color: '#64748b', fontSize: '16px' }}>Complete your profile to access all banking features.</p>
      <Link to="/profile/create" style={{
        background: 'linear-gradient(135deg, #1b3f6e, #0f2444)', color: 'white',
        padding: '14px 32px', borderRadius: '10px', fontWeight: 600,
        fontSize: '15px', textDecoration: 'none',
      }}>
        Create Profile →
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f2444', marginBottom: '4px' }}>My Profile</h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Your personal and address information on file.</p>
        </div>
        <Link to="/profile/create" style={{
          background: '#f1f5f9', color: '#1b3f6e', padding: '10px 20px',
          borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none',
          border: '1px solid #e2e8f0',
        }}>
          Edit Profile
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Personal Info */}
        <div style={S.card}>
          <div style={S.sectionHead}>Personal Information</div>
          <div style={{ ...S.row }}><span style={S.label}>Full Name</span><span style={S.value}>{profile.first_name} {profile.last_name}</span></div>
          <div style={{ ...S.row }}><span style={S.label}>Phone</span><span style={S.value}>{profile.phone}</span></div>
          <div style={{ ...S.row }}><span style={S.label}>Date of Birth</span><span style={S.value}>{profile.date_of_birth}</span></div>
          <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.label}>Tax ID Last 4</span><span style={{ ...S.value, fontFamily: 'monospace', letterSpacing: '2px' }}>••••{profile.tax_id_last4}</span></div>
        </div>

        {/* Address */}
        {profile.address && (
          <div style={S.card}>
            <div style={S.sectionHead}>Address on File</div>
            <div style={{ ...S.row }}><span style={S.label}>Street</span><span style={S.value}>{profile.address.line1}</span></div>
            <div style={{ ...S.row }}><span style={S.label}>City</span><span style={S.value}>{profile.address.city}</span></div>
            <div style={{ ...S.row }}><span style={S.label}>State</span><span style={S.value}>{profile.address.state}</span></div>
            <div style={{ ...S.row }}><span style={S.label}>Postal Code</span><span style={S.value}>{profile.address.postal_code}</span></div>
            <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.label}>Country</span><span style={S.value}>{profile.address.country}</span></div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ marginTop: '24px', background: 'linear-gradient(135deg, #0f2444, #1b3f6e)', borderRadius: '16px', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>✓</div>
        <div>
          <div style={{ color: '#c9a84c', fontWeight: 700, fontSize: '15px' }}>Profile Verified</div>
          <div style={{ color: 'rgba(148,163,184,0.8)', fontSize: '13px', marginTop: '2px' }}>Your identity information is on file and secure.</div>
        </div>
      </div>
    </div>
  )
}
